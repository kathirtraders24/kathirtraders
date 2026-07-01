import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Product, Order, BillPrintService } from '../../../shared';
import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../core';
import { ProductService } from '../../inventory/services/product.service';
import { OrderService } from '../services/order.service';
import { OrderConfirmDialogComponent, OrderConfirmDialogResult } from './order-confirm-dialog.component';
import { DiscountDialogComponent, DiscountDialogData, DiscountDialogResult, DiscountType } from '../../estimations/components/discount-dialog.component';
import { OverallDiscountDialogComponent, OverallDiscountDialogData } from '../../estimations/components/overall-discount-dialog.component';

export interface PurchaseLine {
  productId: string;
  name: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;        // paise
  discountType: DiscountType;
  discountValue: number;    // percent (e.g. 10) or rupees (e.g. 50)
  discount: number;         // paise (computed)
  totalPrice: number;       // paise
}

@Component({
  selector: 'app-purchase-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatAutocompleteModule,
    MatTableModule, MatSelectModule, AsyncPipe, CurrencyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './purchase-form.component.html',
  styleUrl: './purchase-form.component.scss',
})
export class PurchaseFormComponent {
  private productService = inject(ProductService);
  private orderService = inject(OrderService);
  private dialog = inject(MatDialog);
  private notification = inject(NotificationService);
  private billPrintService = inject(BillPrintService);

  searchCtrl = new FormControl('', { nonNullable: true });
  productSuggestions$: Observable<Product[]> = this.searchCtrl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((term) => (term.length >= 2 ? this.productService.search(term) : of([]))),
  );

  lines = signal<PurchaseLine[]>([]);
  overallDiscountType = signal<DiscountType>('flat');
  overallDiscountValue = signal<number>(0);
  gstPercent = signal(0);
  readonly gstOptions = [0, 5, 12, 18, 28];
  readonly showGST = environment.showGST;

  subtotal = computed(() => this.lines().reduce((sum, l) => sum + l.totalPrice, 0));
  overallDiscount = computed(() => {
    const val = this.overallDiscountValue();
    if (!val) return 0;
    if (this.overallDiscountType() === 'percent') return Math.round(this.subtotal() * val / 100);
    return Math.round(val * 100);
  });
  grandTotal = computed(() => Math.max(0, this.subtotal() - this.overallDiscount()));
  displayedColumns = ['sno', 'name', 'hsnCode', 'quantity', 'unitPrice', 'discount', 'totalPrice', 'actions'];

  onProductSelected(product: Product): void {
    const existing = this.lines().find((l) => l.productId === product.id);
    if (existing) {
      this.updateQuantity(existing.productId, existing.quantity + 1);
      this.searchCtrl.setValue('');
      return;
    }

    const line: PurchaseLine = {
      productId: product.id,
      name: product.name,
      hsnCode: product.hsnCode,
      quantity: 1,
      unitPrice: product.unitPrice,
      discountType: 'flat',
      discountValue: 0,
      discount: 0,
      totalPrice: product.unitPrice,
    };

    this.lines.update((prev) => [...prev, line]);
    this.searchCtrl.setValue('');
  }

  displayProduct(product: Product | string): string {
    return typeof product === 'string' ? product : product?.name ?? '';
  }

  updateQuantity(productId: string, qty: number): void {
    if (qty < 1) return;
    this.lines.update((prev) =>
      prev.map((l) => {
        if (l.productId !== productId) return l;
        const lineTotal = l.unitPrice * qty;
        const discount = this.calcDiscount(l.discountType, l.discountValue, lineTotal);
        return { ...l, quantity: qty, discount, totalPrice: lineTotal - discount };
      })
    );
  }

  openDiscountDialog(line: PurchaseLine): void {
    const ref = this.dialog.open(DiscountDialogComponent, {
      data: {
        productName: line.name,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        currentType: line.discountType,
        currentValue: line.discountValue,
      } as DiscountDialogData,
      width: '400px',
    });

    ref.afterClosed().subscribe((result: DiscountDialogResult | undefined) => {
      if (!result) return;
      this.lines.update((prev) =>
        prev.map((l) => {
          if (l.productId !== line.productId) return l;
          const lineTotal = l.unitPrice * l.quantity;
          const discount = this.calcDiscount(result.type, result.value, lineTotal);
          return {
            ...l,
            discountType: result.type,
            discountValue: result.value,
            discount,
            totalPrice: lineTotal - discount,
          };
        })
      );
    });
  }

  getDiscountLabel(line: PurchaseLine): string {
    if (!line.discountValue) return '—';
    return line.discountType === 'percent' ? `${line.discountValue}%` : `₹${line.discountValue}`;
  }

  openOverallDiscountDialog(): void {
    const ref = this.dialog.open(OverallDiscountDialogComponent, {
      data: {
        subtotal: this.subtotal(),
        currentType: this.overallDiscountType(),
        currentValue: this.overallDiscountValue(),
      } as OverallDiscountDialogData,
      width: '400px',
    });

    ref.afterClosed().subscribe((result: DiscountDialogResult | undefined) => {
      if (!result) return;
      this.overallDiscountType.set(result.type);
      this.overallDiscountValue.set(result.value);
    });
  }

  getOverallDiscountLabel(): string {
    if (!this.overallDiscountValue()) return '—';
    return this.overallDiscountType() === 'percent'
      ? `${this.overallDiscountValue()}%`
      : `₹${this.overallDiscountValue()}`;
  }

  getDiscountBillLabel(): string {
    if (!this.overallDiscountValue()) return '';
    return this.overallDiscountType() === 'percent'
      ? `Discount (${this.overallDiscountValue()}%)`
      : `Discount (₹${this.overallDiscountValue()})`;
  }

  private calcDiscount(type: DiscountType, value: number, lineTotal: number): number {
    if (!value) return 0;
    if (type === 'percent') return Math.round(lineTotal * value / 100);
    return Math.round(value * 100);
  }

  removeLine(productId: string): void {
    this.lines.update((prev) => prev.filter((l) => l.productId !== productId));
  }

  confirmOrder(): void {
    const ref = this.dialog.open(OrderConfirmDialogComponent, {
      data: { grandTotal: this.grandTotal() },
      disableClose: true,
    });

    ref.afterClosed().subscribe((result: OrderConfirmDialogResult | null) => {
      if (!result) return;

      const order: Order = {
        id: crypto.randomUUID(),
        customerName: result.customerName,
        customerPhone: result.customerPhone,
        date: result.date,
        lines: this.lines().map((l) => ({
          productId: l.productId,
          name: l.name,
          hsnCode: l.hsnCode,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discount: l.discount,
          totalPrice: l.totalPrice,
        })),
        grandTotal: this.grandTotal(),
        subtotal: this.subtotal(),
        overallDiscount: this.overallDiscount(),
        discountLabel: this.getDiscountBillLabel(),
        paymentStatus: result.paymentStatus,
        payments: result.payments,
        createdAt: new Date().toISOString(),
      };

      this.orderService.placeOrder(order).subscribe({
        next: (saved) => {
          this.printOrder(saved);
          this.lines.set([]);
          this.overallDiscountType.set('flat');
          this.overallDiscountValue.set(0);
          this.gstPercent.set(0);
          this.notification.success('Order confirmed successfully!');
        },
        error: () => {
          this.notification.error('Failed to place order. Please try again.');
        },
      });
    });
  }

  private printOrder(order: Order): void {
    const paymentInfo = order.payments.length > 0
      ? order.payments.map((p) => `${p.mode.toUpperCase()} \u20B9${(p.amount / 100).toFixed(2)}`).join(', ')
      : '—';

    this.billPrintService.print({
      title: 'Cash Bill/Tax Invoice',
      date: order.date,
      lines: order.lines.map((l) => ({
        name: l.name,
        hsnCode: l.hsnCode,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discount: l.discount,
        totalPrice: l.totalPrice,
      })),
      grandTotal: order.grandTotal,
      subtotal: order.subtotal,
      overallDiscount: order.overallDiscount,
      discountLabel: order.discountLabel,
      gstPercent: this.gstPercent() || undefined,
      paidAmount: order.paymentStatus === 'partial'
        ? order.payments.reduce((sum, p) => sum + p.amount, 0)
        : undefined,
      metaFields: [
        { label: 'Customer', value: order.customerName },
        { label: 'Mobile', value: order.customerPhone },
        { label: 'Payment Status', value: order.paymentStatus.toUpperCase() },
        { label: 'Payment', value: paymentInfo },
      ],
      terms: [
        'Goods once sold will not be taken back.',
        'All disputes subject to Kumbakonam jurisdiction.',
      ],
      footerNote: 'Thank you for your business!',
    });
  }
}
