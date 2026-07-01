import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { CurrencyPipe } from '@angular/common';
import { DiscountType, DiscountDialogResult } from './discount-dialog.component';

export interface OverallDiscountDialogData {
  subtotal: number;     // paise
  currentType: DiscountType;
  currentValue: number;
}

@Component({
  selector: 'app-overall-discount-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatButtonToggleModule, CurrencyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Overall Discount</h2>
    <mat-dialog-content>
      <p class="subtotal-info">
        Subtotal: <strong>{{ data.subtotal / 100 | currency:'INR':'symbol':'1.2-2':'en-IN' }}</strong>
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
          &rarr; Grand Total: {{ (data.subtotal - computedDiscount()) / 100 | currency:'INR':'symbol':'1.2-2':'en-IN' }}
        </p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      @if (valueCtrl.value > 0) {
        <button mat-stroked-button color="warn" (click)="clear()">Remove Discount</button>
      }
      <button mat-flat-button color="primary" (click)="apply()" [disabled]="valueCtrl.invalid">
        Apply
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .subtotal-info { margin-bottom: 16px; font-size: 14px; color: #333; }
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
export class OverallDiscountDialogComponent {
  typeCtrl: FormControl<DiscountType>;
  valueCtrl: FormControl<number>;

  constructor(
    private dialogRef: MatDialogRef<OverallDiscountDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OverallDiscountDialogData,
  ) {
    this.typeCtrl = new FormControl<DiscountType>(data.currentType, { nonNullable: true });
    this.valueCtrl = new FormControl<number>(data.currentValue, {
      nonNullable: true,
      validators: [Validators.min(0)],
    });
  }

  maxFlat(): number {
    return this.data.subtotal / 100;
  }

  computedDiscount(): number {
    const val = this.valueCtrl.value || 0;
    if (this.typeCtrl.value === 'percent') {
      return Math.round(this.data.subtotal * val / 100);
    }
    return Math.round(val * 100);
  }

  apply(): void {
    this.dialogRef.close({
      type: this.typeCtrl.value,
      value: this.valueCtrl.value,
    } as DiscountDialogResult);
  }

  clear(): void {
    this.dialogRef.close({
      type: 'flat',
      value: 0,
    } as DiscountDialogResult);
  }
}
