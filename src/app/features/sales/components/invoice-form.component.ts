import { Component, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AsyncPipe, CurrencyPipe, UpperCasePipe } from '@angular/common';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { InvoiceActions } from '../store/invoice.actions';
import { InvoiceService } from '../services/invoice.service';
import { GstService, NotificationService } from '../../../core';
import {
  Product, BillPrintService, PaymentMode, InvoiceLineItem, SalesInvoice,
} from '../../../shared';
import { ProductService } from '../../inventory/services/product.service';

interface InvoiceFormLine {
  productId: string;
  name: string;
  hsnCode: string;
  quantity: number;
  unit: string;       // e.g. Nos, Mtr, Kg
  unitPrice: number;  // paise
  gstRate: number;    // percent
  discount: number;   // paise
}

interface InvoiceDraft {
  customerPhone: string;
  customerName: string;
  customerId?: string;
  date?: string;
  paymentMode?: PaymentMode;
  lines: InvoiceFormLine[];
}

const DRAFT_KEY = 'draft:invoice';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatButtonToggleModule, MatIconModule,
    MatAutocompleteModule, AsyncPipe, CurrencyPipe, UpperCasePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice-form.component.html',
  styleUrl: './invoice-form.component.scss',
})
export class InvoiceFormComponent {
  private store = inject(Store);
  private actions$ = inject(Actions);
  private router = inject(Router);
  private gstService = inject(GstService);
  private notification = inject(NotificationService);
  private productService = inject(ProductService);
  private invoiceService = inject(InvoiceService);
  private billPrintService = inject(BillPrintService);

  searchCtrl = new FormControl('', { nonNullable: true });
  customerPhoneCtrl = new FormControl('', { nonNullable: true });
  customerNameCtrl = new FormControl('', { nonNullable: true });
  dateCtrl = new FormControl(new Date().toISOString().slice(0, 10), { nonNullable: true });
  paymentModeCtrl = new FormControl<PaymentMode>('cash', { nonNullable: true });
  loadNumberCtrl = new FormControl('', { nonNullable: true });

  productSuggestions$: Observable<Product[]> = this.searchCtrl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((term) => (term.length >= 2 ? this.productService.search(term) : of([]))),
  );

  view = signal<'products' | 'bill'>('products');
  pendingQty = signal<Record<string, number>>({});

  private customerPhone = toSignal(this.customerPhoneCtrl.valueChanges, { initialValue: '' });
  private customerName = toSignal(this.customerNameCtrl.valueChanges, { initialValue: '' });

  // Resolved customer UUID for a loaded invoice, reused on update (storage stays UUID).
  private customerId = signal('');

  lines = signal<InvoiceFormLine[]>([]);
  subTotal = signal(0);
  totalCgst = signal(0);
  totalSgst = signal(0);
  grandTotal = signal(0);

  invoiceNumber = signal('');
  loadedId = signal<string | null>(null);
  saving = signal(false);

  readonly gstOptions = [0, 5, 12, 18, 28];
  readonly paymentModes: PaymentMode[] = ['cash', 'upi', 'cheque', 'neft', 'credit'];

  constructor() {
    this.restoreDraft();
    effect(() => this.persistDraft());

    // Clear the draft and return to the list once a save round-trips.
    this.actions$
      .pipe(
        ofType(InvoiceActions.createInvoiceSuccess, InvoiceActions.updateInvoiceSuccess),
        takeUntilDestroyed(),
      )
      .subscribe(({ invoice }) => {
        this.saving.set(false);
        this.clearDraft();
        this.notification.success(`Invoice ${invoice.invoiceNumber} saved`);
        // Auto-print the placed invoice, then return to the list.
        this.printSavedInvoice(invoice);
        this.router.navigate(['/sales']);
      });
  }

  // ── Product picker ───────────────────────────────────────────────
  getPendingQty(productId: string): number {
    return this.pendingQty()[productId] ?? 1;
  }

  incPending(productId: string): void {
    this.pendingQty.update((m) => ({ ...m, [productId]: this.getPendingQty(productId) + 1 }));
  }

  decPending(productId: string): void {
    this.pendingQty.update((m) => ({ ...m, [productId]: Math.max(1, this.getPendingQty(productId) - 1) }));
  }

  private resetPending(productId: string): void {
    this.pendingQty.update((m) => {
      const copy = { ...m };
      delete copy[productId];
      return copy;
    });
  }

  /** Add product with chosen quantity; newest first (LIFO). */
  addProduct(product: Product): void {
    const qty = this.getPendingQty(product.id);
    const existing = this.lines().find((l) => l.productId === product.id);

    if (existing) {
      const updated = { ...existing, quantity: existing.quantity + qty };
      const rest = this.lines().filter((l) => l.productId !== product.id);
      this.lines.set([updated, ...rest]);
    } else {
      this.lines.set([
        {
          productId: product.id,
          name: product.name,
          hsnCode: product.hsnCode,
          quantity: qty,
          unit: product.unit || 'Nos',
          unitPrice: product.unitPrice,
          gstRate: product.gstRate ?? 18,
          discount: 0,
        },
        ...this.lines(),
      ]);
    }

    this.resetPending(product.id);
    this.recalculate();
    this.searchCtrl.setValue('');
  }

  /** Keeps the search input clear after an autocomplete option is chosen. */
  displayProduct(): string {
    return '';
  }

  /** Open the full product-creation page (all fields). The draft is preserved. */
  addNewProduct(): void {
    this.router.navigate(['/inventory', 'new']);
  }

  // ── Line editing (bill view) ─────────────────────────────────────
  updateQuantity(productId: string, qty: number): void {
    if (qty < 1) return;
    this.lines.update((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, quantity: qty } : l))
    );
    this.recalculate();
  }

  updateGstRate(productId: string, gstRate: number): void {
    this.lines.update((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, gstRate } : l))
    );
    this.recalculate();
  }

  /** Discount entered in rupees; stored as paise. */
  updateDiscount(productId: string, rupees: number): void {
    const discount = Math.max(0, Math.round((rupees || 0) * 100));
    this.lines.update((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, discount } : l))
    );
    this.recalculate();
  }

  removeLine(productId: string): void {
    this.lines.update((prev) => prev.filter((l) => l.productId !== productId));
    this.recalculate();
  }

  lineTotal(line: InvoiceFormLine): number {
    const taxable = Math.max(0, line.unitPrice * line.quantity - line.discount);
    const tax = this.gstService.calculateTax(taxable, line.gstRate, '33');
    return taxable + tax.totalTax;
  }

  clearAll(): void {
    this.lines.set([]);
    this.subTotal.set(0);
    this.totalCgst.set(0);
    this.totalSgst.set(0);
    this.grandTotal.set(0);
    this.pendingQty.set({});
    this.invoiceNumber.set('');
    this.loadedId.set(null);
    this.customerId.set('');
    this.loadNumberCtrl.setValue('');
    this.customerPhoneCtrl.setValue('');
    this.customerNameCtrl.setValue('');
    this.paymentModeCtrl.setValue('cash');
    this.view.set('products');
    this.clearDraft();
  }

  private recalculate(): void {
    let sub = 0;
    let cgst = 0;
    let sgst = 0;
    for (const l of this.lines()) {
      const taxable = Math.max(0, l.unitPrice * l.quantity - l.discount);
      const tax = this.gstService.calculateTax(taxable, l.gstRate, '33');
      sub += taxable;
      cgst += tax.cgst;
      sgst += tax.sgst;
    }
    this.subTotal.set(sub);
    this.totalCgst.set(cgst);
    this.totalSgst.set(sgst);
    this.grandTotal.set(sub + cgst + sgst);
  }

  // ── Save / Update / Load (items 6-7) ─────────────────────────────
  get canUpdate(): boolean {
    return this.loadedId() !== null;
  }

  get canSave(): boolean {
    return this.lines().length > 0 && !!this.customerPhoneCtrl.value.trim() && !!this.customerNameCtrl.value.trim();
  }

  loadByNumber(): void {
    const num = this.loadNumberCtrl.value.trim();
    if (!num) return;
    this.invoiceService.getByNumber(num).subscribe({
      next: (inv) => {
        this.applyInvoice(inv);
        this.notification.success(`Loaded ${inv.invoiceNumber}`);
      },
      error: () => this.notification.error(`Invoice "${num}" not found`),
    });
  }

  saveNew(): void {
    if (!this.canSave) {
      this.notification.error('Customer phone, name and at least one item are required');
      return;
    }
    this.saving.set(true);
    this.store.dispatch(InvoiceActions.createInvoice({ invoice: this.buildPayload() }));
  }

  saveUpdate(): void {
    const id = this.loadedId();
    if (!id || !this.canSave) return;
    this.saving.set(true);
    this.store.dispatch(InvoiceActions.updateInvoice({ id, changes: this.buildPayload() }));
  }

  printInvoice(): void {
    this.billPrintService.print({
      title: 'Tax Invoice',
      date: this.dateCtrl.value,
      customerName: this.customerNameCtrl.value.trim() || undefined,
      lines: this.lines().map((l) => ({
        name: l.name,
        hsnCode: l.hsnCode,
        quantity: l.quantity,
        unit: l.unit,
        unitPrice: l.unitPrice,
        discount: l.discount,
        totalPrice: this.lineTotal(l),
      })),
      grandTotal: this.grandTotal(),
      terms: [
        'Goods once sold will not be taken back or exchanged.',
        'All disputes subject to Kumbakonam jurisdiction.',
      ],
      footerNote: 'Computer generated invoice',
    });
  }

  cancel(): void {
    this.router.navigate(['/sales']);
  }

  /** Print the invoice returned by the server after a successful save. */
  private printSavedInvoice(inv: SalesInvoice): void {
    const invLines = inv.lines ?? [];
    // Show the CGST/SGST breakdown only when every line shares one GST rate.
    const rates = Array.from(new Set(invLines.map((l) => l.gstRate)));
    const uniformRate = rates.length === 1 ? rates[0] : 0;

    this.billPrintService.print({
      title: 'Tax Invoice',
      date: inv.date,
      customerName: inv.customerName || undefined,
      metaFields: [{ label: 'Invoice No', value: inv.invoiceNumber }],
      lines: invLines.map((l) => ({
        name: l.productName,
        hsnCode: l.hsnCode,
        quantity: l.quantity,
        unit: l.unit,
        unitPrice: l.unitRate,
        discount: l.discount,
        totalPrice: l.lineTotal,
      })),
      grandTotal: inv.grandTotal,
      gstPercent: uniformRate > 0 ? uniformRate : undefined,
      terms: [
        'Goods once sold will not be taken back or exchanged.',
        'All disputes subject to Kumbakonam jurisdiction.',
      ],
      footerNote: 'Computer generated invoice',
    });
  }

  private buildPayload(): Omit<SalesInvoice, 'id' | 'invoiceNumber'> {
    const lines: InvoiceLineItem[] = this.lines().map((l) => {
      const taxable = Math.max(0, l.unitPrice * l.quantity - l.discount);
      const tax = this.gstService.calculateTax(taxable, l.gstRate, '33');
      return {
        productId: l.productId,
        productName: l.name,
        hsnCode: l.hsnCode,
        quantity: l.quantity,
        unit: l.unit,
        unitRate: l.unitPrice,
        discount: l.discount,
        gstRate: l.gstRate,
        cgst: tax.cgst,
        sgst: tax.sgst,
        igst: tax.igst,
        lineTotal: taxable + tax.totalTax,
      };
    });

    return {
      date: this.dateCtrl.value,
      customerId: this.customerId() || undefined,
      customerPhone: this.customerPhoneCtrl.value.trim(),
      customerName: this.customerNameCtrl.value.trim(),
      lines,
      subTotal: this.subTotal(),
      totalCgst: this.totalCgst(),
      totalSgst: this.totalSgst(),
      totalIgst: 0,
      grandTotal: this.grandTotal(),
      paymentMode: this.paymentModeCtrl.value,
      status: 'draft',
    } as unknown as Omit<SalesInvoice, 'id' | 'invoiceNumber'>;
  }

  private applyInvoice(inv: SalesInvoice): void {
    const formLines: InvoiceFormLine[] = (inv.lines ?? []).map((l) => ({
      productId: l.productId,
      name: l.productName,
      hsnCode: l.hsnCode,
      quantity: l.quantity,
      unit: l.unit || 'Nos',
      unitPrice: l.unitRate,
      gstRate: l.gstRate,
      discount: l.discount,
    }));
    this.lines.set(formLines);
    this.customerId.set(inv.customerId ?? '');
    this.customerPhoneCtrl.setValue((inv as { customer?: { phone?: string } }).customer?.phone ?? '');
    this.customerNameCtrl.setValue(inv.customerName ?? '');
    this.dateCtrl.setValue((inv.date ?? '').slice(0, 10) || this.dateCtrl.value);
    this.paymentModeCtrl.setValue(inv.paymentMode ?? 'cash');
    this.loadedId.set(inv.id);
    this.invoiceNumber.set(inv.invoiceNumber);
    this.recalculate();
    this.view.set('bill');
  }

  // ── Draft persistence (localStorage) ─────────────────────────────
  private restoreDraft(): void {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw) as Partial<InvoiceDraft>;
      this.lines.set((d.lines ?? []).map((l) => ({ ...l, unit: l.unit || 'Nos' })));
      this.customerId.set(d.customerId ?? '');
      this.customerPhoneCtrl.setValue(d.customerPhone ?? '');
      this.customerNameCtrl.setValue(d.customerName ?? '');
      if (d.date) this.dateCtrl.setValue(d.date);
      if (d.paymentMode) this.paymentModeCtrl.setValue(d.paymentMode);
      this.recalculate();
      if ((d.lines ?? []).length > 0) this.view.set('bill');
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }

  private persistDraft(): void {
    const draft: InvoiceDraft = {
      customerPhone: this.customerPhone(),
      customerName: this.customerName(),
      customerId: this.customerId() || undefined,
      date: this.dateCtrl.value,
      paymentMode: this.paymentModeCtrl.value,
      lines: this.lines(),
    };
    if (draft.lines.length === 0 && !draft.customerPhone && !draft.customerName) {
      localStorage.removeItem(DRAFT_KEY);
      return;
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  private clearDraft(): void {
    localStorage.removeItem(DRAFT_KEY);
  }
}
