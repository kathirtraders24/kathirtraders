import { Component, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Product, BillPrintService, Estimation, EstimationStatus } from '../../../shared';
import { GstService, NotificationService } from '../../../core';
import { environment } from '../../../../environments/environment';
import { ProductService } from '../../inventory/services/product.service';
import { EstimationService } from '../services/estimation.service';
import {
  DiscountDialogComponent, DiscountDialogResult, DiscountType,
} from './discount-dialog.component';
import {
  OverallDiscountDialogComponent,
} from './overall-discount-dialog.component';

export interface EstimationLine {
  productId: string;
  name: string;
  hsnCode: string;
  quantity: number;
  unit: string;          // e.g. Nos, Mtr, Kg
  unitPrice: number;     // paise
  discountType: DiscountType;
  discountValue: number; // percent number or rupees number
  discount: number;      // paise (computed)
  totalPrice: number;    // paise
}

interface EstimationDraft {
  lines: EstimationLine[];
  customerName: string;
  customerPhone: string;
  overallDiscountType: DiscountType;
  overallDiscountValue: number;
  gstPercent: number;
}

const DRAFT_KEY = 'draft:estimation';

@Component({
  selector: 'app-estimation-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatButtonToggleModule, MatIconModule,
    MatAutocompleteModule, MatTableModule, MatSelectModule, AsyncPipe, CurrencyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './estimation-form.component.html',
  styleUrl: './estimation-form.component.scss',
})
export class EstimationFormComponent {
  private productService = inject(ProductService);
  private billPrintService = inject(BillPrintService);
  private estimationService = inject(EstimationService);
  private gstService = inject(GstService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  searchCtrl = new FormControl('', { nonNullable: true });
  customerNameCtrl = new FormControl('', { nonNullable: true });
  customerPhoneCtrl = new FormControl('', { nonNullable: true });
  loadNumberCtrl = new FormControl('', { nonNullable: true });

  // Identity/round-trip state for save & update (items 6-7).
  estimationNumber = signal('');
  loadedId = signal<string | null>(null);
  saving = signal(false);
  private dateIso = signal(new Date().toISOString().slice(0, 10));
  private validUntil = signal('');
  private customerAddress = signal('');
  private customerGstin = signal('');
  private notes = signal('');
  private status = signal<EstimationStatus>('draft');
  productSuggestions$: Observable<Product[]> = this.searchCtrl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((term) => (term.length >= 2 ? this.productService.search(term) : of([]))),
  );

  // Which pane is visible: product picker vs. the estimation/bill summary.
  view = signal<'products' | 'bill'>('products');
  // Pending quantity chosen in the search results before the product is added.
  pendingQty = signal<Record<string, number>>({});

  // Customer fields mirrored as signals so draft persistence tracks them.
  private customerName = toSignal(this.customerNameCtrl.valueChanges, { initialValue: '' });
  private customerPhone = toSignal(this.customerPhoneCtrl.valueChanges, { initialValue: '' });

  lines = signal<EstimationLine[]>([]);
  subtotal = signal(0);
  overallDiscountType = signal<DiscountType>('flat');
  overallDiscountValue = signal(0);
  overallDiscount = signal(0);   // paise
  grandTotal = signal(0);
  gstPercent = signal(0);        // 0 = no GST, e.g. 5, 12, 18, 28
  readonly gstOptions = [0, 5, 12, 18, 28];
  readonly showGST = environment.showGST;
  displayedColumns = ['sno', 'name', 'hsnCode', 'quantity', 'unitPrice', 'discount', 'totalPrice', 'actions'];
  today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  constructor() {
    this.restoreDraft();
    // Persist on any change to the tracked state; cleared explicitly on cancel/save.
    effect(() => this.persistDraft());
  }

  // ── Product picker (search results) ──────────────────────────────
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

  /** Add the product with its chosen quantity. Newest entries go to the top (LIFO). */
  addProduct(product: Product): void {
    const qty = this.getPendingQty(product.id);
    const existing = this.lines().find((l) => l.productId === product.id);

    if (existing) {
      const newQty = existing.quantity + qty;
      const lineTotal = existing.unitPrice * newQty;
      const disc = this.calcDiscount(existing.discountType, existing.discountValue, lineTotal);
      const updated = { ...existing, quantity: newQty, discount: disc, totalPrice: lineTotal - disc };
      const rest = this.lines().filter((l) => l.productId !== product.id);
      this.lines.set([updated, ...rest]);
    } else {
      const line: EstimationLine = {
        productId: product.id,
        name: product.name,
        hsnCode: product.hsnCode,
        quantity: qty,
        unit: product.unit || 'Nos',
        unitPrice: product.unitPrice,
        discountType: 'flat',
        discountValue: 0,
        discount: 0,
        totalPrice: product.unitPrice * qty,
      };
      this.lines.set([line, ...this.lines()]);
    }

    this.resetPending(product.id);
    this.recalcGrandTotal();
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
      prev.map((l) => {
        if (l.productId !== productId) return l;
        const lineTotal = l.unitPrice * qty;
        const disc = this.calcDiscount(l.discountType, l.discountValue, lineTotal);
        return { ...l, quantity: qty, discount: disc, totalPrice: lineTotal - disc };
      })
    );
    this.recalcGrandTotal();
  }

  openDiscountDialog(line: EstimationLine): void {
    const ref = this.dialog.open(DiscountDialogComponent, {
      data: {
        productName: line.name,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        currentType: line.discountType,
        currentValue: line.discountValue,
      },
    });

    ref.afterClosed().subscribe((result: DiscountDialogResult | undefined) => {
      if (!result) return;
      this.lines.update((prev) =>
        prev.map((l) => {
          if (l.productId !== line.productId) return l;
          const lineTotal = l.unitPrice * l.quantity;
          const disc = this.calcDiscount(result.type, result.value, lineTotal);
          return {
            ...l,
            discountType: result.type,
            discountValue: result.value,
            discount: disc,
            totalPrice: lineTotal - disc,
          };
        })
      );
      this.recalcGrandTotal();
    });
  }

  getDiscountLabel(line: EstimationLine): string {
    if (line.discountValue === 0) return '—';
    if (line.discountType === 'percent') return `${line.discountValue}%`;
    return `₹${line.discountValue}`;
  }

  removeLine(productId: string): void {
    this.lines.update((prev) => prev.filter((l) => l.productId !== productId));
    this.recalcGrandTotal();
  }

  clearAll(): void {
    this.lines.set([]);
    this.subtotal.set(0);
    this.overallDiscountType.set('flat');
    this.overallDiscountValue.set(0);
    this.overallDiscount.set(0);
    this.grandTotal.set(0);
    this.gstPercent.set(0);
    this.customerNameCtrl.setValue('');
    this.customerPhoneCtrl.setValue('');
    this.pendingQty.set({});
    this.estimationNumber.set('');
    this.loadedId.set(null);
    this.loadNumberCtrl.setValue('');
    this.customerAddress.set('');
    this.customerGstin.set('');
    this.validUntil.set('');
    this.notes.set('');
    this.status.set('draft');
    this.view.set('products');
    this.clearDraft();
  }

  openOverallDiscountDialog(): void {
    const ref = this.dialog.open(OverallDiscountDialogComponent, {
      data: {
        subtotal: this.subtotal(),
        currentType: this.overallDiscountType(),
        currentValue: this.overallDiscountValue(),
      },
    });

    ref.afterClosed().subscribe((result: DiscountDialogResult | undefined) => {
      if (!result) return;
      this.overallDiscountType.set(result.type);
      this.overallDiscountValue.set(result.value);
      this.recalcGrandTotal();
    });
  }

  getOverallDiscountLabel(): string {
    const val = this.overallDiscountValue();
    if (val === 0) return '—';
    if (this.overallDiscountType() === 'percent') return `${val}%`;
    return `₹${val}`;
  }

  private getDiscountBillLabel(): string {
    const val = this.overallDiscountValue();
    if (this.overallDiscountType() === 'percent') return `Discount (${val}%)`;
    return `Discount (₹${val})`;
  }

  printEstimation(): void {
    this.billPrintService.print({
      title: 'Estimation',
      date: this.today,
      customerName: this.customerNameCtrl.value.trim() || undefined,
      customerPhone: this.customerPhoneCtrl.value.trim() || undefined,
      lines: this.lines().map((l) => ({
        name: l.name,
        hsnCode: l.hsnCode,
        quantity: l.quantity,
        unit: l.unit,
        unitPrice: l.unitPrice,
        discount: l.discount,
        totalPrice: l.totalPrice,
      })),
      grandTotal: this.grandTotal(),
      subtotal: this.overallDiscount() > 0 ? this.subtotal() : undefined,
      overallDiscount: this.overallDiscount() > 0 ? this.overallDiscount() : undefined,
      discountLabel: this.overallDiscount() > 0 ? this.getDiscountBillLabel() : undefined,
      gstPercent: this.gstPercent() || undefined,
      terms: [
        'This is an estimation only, not a tax invoice.',
        'Prices are subject to change without prior notice.',
        'Goods once sold will not be taken back.',
        'This estimation is valid for 15 days from the date of issue.',
      ],
      footerNote: 'Computer generated estimation',
    });
  }

  toRupees(paise: number): number {
    return paise / 100;
  }

  // ── Save / Update / Load by number (items 6-7) ───────────────────
  get canUpdate(): boolean {
    return this.loadedId() !== null;
  }

  /** Fetch an existing estimation by its number and load it into the form. */
  loadByNumber(): void {
    const num = this.loadNumberCtrl.value.trim();
    if (!num) return;
    this.estimationService.getByNumber(num).subscribe({
      next: (est) => {
        this.applyEstimation(est);
        this.notification.success(`Loaded ${est.estimationNumber}`);
      },
      error: () => this.notification.error(`Estimation "${num}" not found`),
    });
  }

  /** Create a brand new estimation (server assigns the number). */
  saveNew(): void {
    if (this.lines().length === 0) return;
    this.saving.set(true);
    this.estimationService.create(this.buildPayload()).subscribe({
      next: (created) => {
        this.loadedId.set(created.id);
        this.estimationNumber.set(created.estimationNumber);
        this.status.set(created.status);
        this.saving.set(false);
        this.clearDraft();
        this.notification.success(`Estimation ${created.estimationNumber} created`);
      },
      error: () => this.saving.set(false),
    });
  }

  /** Update the currently loaded estimation. */
  saveUpdate(): void {
    const id = this.loadedId();
    if (!id || this.lines().length === 0) return;
    this.saving.set(true);
    this.estimationService.update(id, this.buildPayload()).subscribe({
      next: (updated) => {
        this.estimationNumber.set(updated.estimationNumber);
        this.saving.set(false);
        this.clearDraft();
        this.notification.success(`Estimation ${updated.estimationNumber} updated`);
      },
      error: () => this.saving.set(false),
    });
  }

  /** Item 8: hand the current lines to a new invoice via the invoice draft. */
  createInvoice(): void {
    if (this.lines().length === 0) return;
    const gstRate = this.gstPercent() || 18;
    const invoiceDraft = {
      customerName: this.customerNameCtrl.value.trim(),
      customerPhone: this.customerPhoneCtrl.value.trim(),
      lines: this.lines().map((l) => ({
        productId: l.productId,
        name: l.name,
        hsnCode: l.hsnCode,
        quantity: l.quantity,
        unit: l.unit,
        unitPrice: l.unitPrice,
        gstRate,
        discount: l.discount,
      })),
    };
    localStorage.setItem('draft:invoice', JSON.stringify(invoiceDraft));
    this.notification.success('Products copied to a new invoice');
    this.router.navigate(['/sales/new']);
  }

  private applyEstimation(est: Estimation): void {
    const estLines = est.lines ?? [];
    const formLines: EstimationLine[] = estLines.map((l) => {
      const gross = l.unitRate * l.quantity;
      return {
        productId: l.productId,
        name: l.productName,
        hsnCode: l.hsnCode,
        quantity: l.quantity,
        unit: l.unit || 'Nos',
        unitPrice: l.unitRate,
        discountType: 'flat',
        discountValue: Math.round(l.discount / 100),
        discount: l.discount,
        totalPrice: gross - l.discount,
      };
    });

    this.lines.set(formLines);
    this.customerNameCtrl.setValue(est.customerName ?? '');
    this.customerPhoneCtrl.setValue(est.customerPhone ?? '');
    this.customerAddress.set(est.customerAddress ?? '');
    this.customerGstin.set(est.customerGstin ?? '');
    this.dateIso.set((est.date ?? '').slice(0, 10) || this.dateIso());
    this.validUntil.set((est.validUntil ?? '').slice(0, 10));
    this.notes.set(est.notes ?? '');
    this.status.set(est.status ?? 'draft');
    this.gstPercent.set(estLines[0]?.gstRate ?? 0);
    this.overallDiscountType.set(est.overallDiscountType ?? 'flat');
    this.overallDiscountValue.set(est.overallDiscountValue ?? 0);
    this.loadedId.set(est.id);
    this.estimationNumber.set(est.estimationNumber);
    this.recalcGrandTotal();
    this.view.set('bill');
  }

  private buildPayload(): Omit<Estimation, 'id' | 'estimationNumber'> {
    const gstRate = this.gstPercent();
    const lines = this.lines().map((l) => {
      const taxable = l.totalPrice;
      const tax = this.gstService.calculateTax(taxable, gstRate, '33');
      return {
        productId: l.productId,
        productName: l.name,
        hsnCode: l.hsnCode,
        quantity: l.quantity,
        unit: l.unit,
        unitRate: l.unitPrice,
        discount: l.discount,
        gstRate,
        cgst: tax.cgst,
        sgst: tax.sgst,
        igst: tax.igst,
        lineTotal: taxable + tax.totalTax,
      };
    });

    const totalCgst = lines.reduce((s, l) => s + l.cgst, 0);
    const totalSgst = lines.reduce((s, l) => s + l.sgst, 0);
    const totalIgst = lines.reduce((s, l) => s + l.igst, 0);
    const subTotal = this.subtotal();
    const grandTotal = subTotal + totalCgst + totalSgst + totalIgst - this.overallDiscount();

    return {
      date: this.dateIso(),
      validUntil: this.validUntil() || undefined,
      customerId: undefined,
      customerName: this.customerNameCtrl.value.trim() || 'Walk-in Customer',
      customerAddress: this.customerAddress(),
      customerPhone: this.customerPhoneCtrl.value.trim(),
      customerGstin: this.customerGstin() || undefined,
      lines,
      subTotal,
      totalCgst,
      totalSgst,
      totalIgst,
      grandTotal,
      overallDiscountType: this.overallDiscountType(),
      overallDiscountValue: this.overallDiscountValue(),
      overallDiscount: this.overallDiscount(),
      notes: this.notes() || undefined,
      status: this.status(),
    } as unknown as Omit<Estimation, 'id' | 'estimationNumber'>;
  }

  private calcDiscount(type: DiscountType, value: number, lineTotal: number): number {
    if (type === 'percent') return Math.round(lineTotal * value / 100);
    return Math.round(value * 100);
  }

  private recalcGrandTotal(): void {
    const sub = this.lines().reduce((sum, l) => sum + l.totalPrice, 0);
    this.subtotal.set(sub);
    const disc = this.calcDiscount(this.overallDiscountType(), this.overallDiscountValue(), sub);
    this.overallDiscount.set(disc);
    this.grandTotal.set(sub - disc);
  }

  // ── Draft persistence (localStorage) ─────────────────────────────
  private restoreDraft(): void {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw) as Partial<EstimationDraft>;
      this.lines.set((d.lines ?? []).map((l) => ({ ...l, unit: l.unit || 'Nos' })));
      this.overallDiscountType.set(d.overallDiscountType ?? 'flat');
      this.overallDiscountValue.set(d.overallDiscountValue ?? 0);
      this.gstPercent.set(d.gstPercent ?? 0);
      this.customerNameCtrl.setValue(d.customerName ?? '');
      this.customerPhoneCtrl.setValue(d.customerPhone ?? '');
      this.recalcGrandTotal();
      if ((d.lines ?? []).length > 0) this.view.set('bill');
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }

  private persistDraft(): void {
    const draft: EstimationDraft = {
      lines: this.lines(),
      customerName: this.customerName(),
      customerPhone: this.customerPhone(),
      overallDiscountType: this.overallDiscountType(),
      overallDiscountValue: this.overallDiscountValue(),
      gstPercent: this.gstPercent(),
    };
    // Don't leave an empty draft lingering in storage.
    if (draft.lines.length === 0 && !draft.customerName && !draft.customerPhone) {
      localStorage.removeItem(DRAFT_KEY);
      return;
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  private clearDraft(): void {
    localStorage.removeItem(DRAFT_KEY);
  }
}
