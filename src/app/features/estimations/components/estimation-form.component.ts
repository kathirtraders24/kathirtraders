import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
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
import { Product, BillPrintService } from '../../../shared';
import { environment } from '../../../../environments/environment';
import { ProductService } from '../../inventory/services/product.service';
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
  unitPrice: number;     // paise
  discountType: DiscountType;
  discountValue: number; // percent number or rupees number
  discount: number;      // paise (computed)
  totalPrice: number;    // paise
}

@Component({
  selector: 'app-estimation-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatAutocompleteModule,
    MatTableModule, MatSelectModule, AsyncPipe, CurrencyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './estimation-form.component.html',
  styleUrl: './estimation-form.component.scss',
})
export class EstimationFormComponent {
  private productService = inject(ProductService);
  private billPrintService = inject(BillPrintService);
  private dialog = inject(MatDialog);

  searchCtrl = new FormControl('', { nonNullable: true });
  customerNameCtrl = new FormControl('', { nonNullable: true });
  customerPhoneCtrl = new FormControl('', { nonNullable: true });
  productSuggestions$: Observable<Product[]> = this.searchCtrl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((term) => (term.length >= 2 ? this.productService.search(term) : of([]))),
  );

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

  onProductSelected(product: Product): void {
    const existing = this.lines().find((l) => l.productId === product.id);
    if (existing) {
      this.updateQuantity(existing.productId, existing.quantity + 1);
      this.searchCtrl.setValue('');
      return;
    }

    const line: EstimationLine = {
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
    this.recalcGrandTotal();
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
}
