import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { CurrencyPipe } from '@angular/common';

export type DiscountType = 'percent' | 'flat';

export interface DiscountDialogData {
  productName: string;
  unitPrice: number;    // paise
  quantity: number;
  currentType: DiscountType;
  currentValue: number; // percent (e.g. 10) or rupees (e.g. 50)
}

export interface DiscountDialogResult {
  type: DiscountType;
  value: number; // percent or rupees
}

@Component({
  selector: 'app-discount-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatButtonToggleModule, CurrencyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Set Discount</h2>
    <mat-dialog-content>
      <p class="product-info">
        <strong>{{ data.productName }}</strong><br>
        Unit Price: {{ data.unitPrice / 100 | currency:'INR':'symbol':'1.2-2':'en-IN' }}
        &times; {{ data.quantity }} =
        {{ (data.unitPrice * data.quantity) / 100 | currency:'INR':'symbol':'1.2-2':'en-IN' }}
      </p>

      <mat-button-toggle-group [formControl]="typeCtrl" class="type-toggle">
        <mat-button-toggle value="percent">% Percentage</mat-button-toggle>
        <mat-button-toggle value="flat">₹ Flat Amount</mat-button-toggle>
      </mat-button-toggle-group>

      <mat-form-field appearance="outline" class="value-field">
        <mat-label>{{ typeCtrl.value === 'percent' ? 'Discount %' : 'Discount ₹' }}</mat-label>
        <input matInput type="number" [formControl]="valueCtrl" min="0"
          [max]="typeCtrl.value === 'percent' ? 100 : maxFlat()">
        <span matSuffix>{{ typeCtrl.value === 'percent' ? '%' : '₹' }}</span>
      </mat-form-field>

      @if (computedDiscount() > 0) {
        <p class="preview">
          Discount: {{ computedDiscount() / 100 | currency:'INR':'symbol':'1.2-2':'en-IN' }}
          &rarr; Net: {{ (lineTotal() - computedDiscount()) / 100 | currency:'INR':'symbol':'1.2-2':'en-IN' }}
        </p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="apply()" [disabled]="valueCtrl.invalid">
        Apply
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .product-info { margin-bottom: 16px; font-size: 13px; color: #555; }
    .type-toggle { margin-bottom: 16px; width: 100%; }
    .type-toggle mat-button-toggle { flex: 1; }
    .value-field { width: 100%; }
    .preview {
      margin-top: 8px;
      padding: 8px 12px;
      background: #e8f5e9;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      color: #2e7d32;
    }
  `],
})
export class DiscountDialogComponent {
  typeCtrl: FormControl<DiscountType>;
  valueCtrl: FormControl<number>;

  constructor(
    private dialogRef: MatDialogRef<DiscountDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DiscountDialogData,
  ) {
    this.typeCtrl = new FormControl<DiscountType>(data.currentType, { nonNullable: true });
    this.valueCtrl = new FormControl<number>(data.currentValue, {
      nonNullable: true,
      validators: [Validators.min(0)],
    });
  }

  lineTotal(): number {
    return this.data.unitPrice * this.data.quantity;
  }

  maxFlat(): number {
    return this.lineTotal() / 100;
  }

  computedDiscount(): number {
    const val = this.valueCtrl.value || 0;
    if (this.typeCtrl.value === 'percent') {
      return Math.round(this.lineTotal() * val / 100);
    }
    return Math.round(val * 100);
  }

  apply(): void {
    this.dialogRef.close({
      type: this.typeCtrl.value,
      value: this.valueCtrl.value,
    } as DiscountDialogResult);
  }
}
