import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CurrencyPipe } from '@angular/common';
import { PaiseAmount, PaymentMode, OrderPaymentStatus, PaymentSplit } from '../../../shared/models';

export interface OrderConfirmDialogData {
  grandTotal: PaiseAmount;
}

export interface OrderConfirmDialogResult {
  customerName: string;
  customerPhone: string;
  date: string;
  paymentStatus: OrderPaymentStatus;
  payments: PaymentSplit[];
}

@Component({
  selector: 'app-order-confirm-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSelectModule, MatIconModule, MatDividerModule, CurrencyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Confirm Order</h2>
    <mat-dialog-content class="dialog-content">
      <p class="order-total">
        Order Total: {{ data.grandTotal / 100 | currency:'INR':'symbol':'1.2-2':'en-IN' }}
      </p>

      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Customer Name</mat-label>
          <input matInput formControlName="customerName" placeholder="Enter customer name">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Mobile Number</mat-label>
          <input matInput formControlName="customerPhone" placeholder="Enter mobile number" maxlength="10">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Date</mat-label>
          <input matInput type="date" formControlName="date">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Payment Status</mat-label>
          <mat-select formControlName="paymentStatus">
            <mat-option value="paid">Paid</mat-option>
            <mat-option value="partial">Partial</mat-option>
            <mat-option value="unpaid">Unpaid</mat-option>
          </mat-select>
        </mat-form-field>

        @if (form.get('paymentStatus')?.value !== 'unpaid') {
          <mat-divider></mat-divider>
          <h4 class="split-title">Payment Split</h4>

          @for (split of paymentSplits(); track $index; let i = $index) {
            <div class="split-row">
              <mat-form-field appearance="outline" class="split-mode">
                <mat-label>Mode</mat-label>
                <mat-select [value]="split.mode" (selectionChange)="updateSplitMode(i, $event.value)">
                  <mat-option value="cash">Cash</mat-option>
                  <mat-option value="upi">UPI</mat-option>
                  <mat-option value="cheque">Cheque</mat-option>
                  <mat-option value="neft">NEFT</mat-option>
                  <mat-option value="credit">Credit</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="split-amount">
                <mat-label>Amount (₹)</mat-label>
                <input
                  matInput
                  type="number"
                  [value]="split.amount / 100"
                  min="0"
                  (change)="updateSplitAmount(i, $any($event.target).valueAsNumber)"
                >
              </mat-form-field>
              @if (paymentSplits().length > 1) {
                <button mat-icon-button color="warn" (click)="removeSplit(i)">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </div>
          }

          <div class="split-actions">
            <button mat-stroked-button type="button" (click)="addSplit()">
              <mat-icon>add</mat-icon> Add Split
            </button>
            <span class="split-total" [class.mismatch]="splitTotal() !== data.grandTotal">
              Split Total: {{ splitTotal() / 100 | currency:'INR':'symbol':'1.2-2':'en-IN' }}
              @if (splitTotal() !== data.grandTotal && form.get('paymentStatus')?.value === 'paid') {
                <mat-icon class="warn-icon">warning</mat-icon>
              }
            </span>
          </div>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="form.invalid"
        (click)="confirm()"
      >
        Confirm Order
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content { min-width: 420px; }
    .order-total {
      font-size: 18px;
      font-weight: 700;
      color: #1a237e;
      margin-bottom: 16px;
      text-align: center;
    }
    .full-width { width: 100%; }
    .split-title { margin: 12px 0 8px; color: #555; }
    .split-row {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 4px;
    }
    .split-mode { flex: 1; }
    .split-amount { flex: 1; }
    .split-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 4px;
    }
    .split-total {
      font-size: 13px;
      font-weight: 600;
      color: #1a237e;
    }
    .split-total.mismatch { color: #e53935; }
    .warn-icon { font-size: 16px; height: 16px; width: 16px; vertical-align: middle; color: #e53935; }
  `],
})
export class OrderConfirmDialogComponent {
  data = inject<OrderConfirmDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<OrderConfirmDialogComponent>);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    customerName: ['', Validators.required],
    customerPhone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    date: [new Date().toISOString().substring(0, 10), Validators.required],
    paymentStatus: ['paid' as OrderPaymentStatus, Validators.required],
  });

  paymentSplits = signal<PaymentSplit[]>([
    { mode: 'cash', amount: this.data.grandTotal },
  ]);

  splitTotal = signal(this.data.grandTotal);

  addSplit(): void {
    this.paymentSplits.update((prev) => [...prev, { mode: 'cash', amount: 0 }]);
  }

  removeSplit(index: number): void {
    this.paymentSplits.update((prev) => prev.filter((_, i) => i !== index));
    this.recalcSplitTotal();
  }

  updateSplitMode(index: number, mode: PaymentMode): void {
    this.paymentSplits.update((prev) =>
      prev.map((s, i) => (i === index ? { ...s, mode } : s))
    );
  }

  updateSplitAmount(index: number, rupees: number): void {
    const paise = Math.round((rupees || 0) * 100);
    this.paymentSplits.update((prev) =>
      prev.map((s, i) => (i === index ? { ...s, amount: paise } : s))
    );
    this.recalcSplitTotal();
  }

  confirm(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const result: OrderConfirmDialogResult = {
      customerName: raw.customerName!,
      customerPhone: raw.customerPhone!,
      date: raw.date!,
      paymentStatus: raw.paymentStatus!,
      payments: raw.paymentStatus === 'unpaid' ? [] : this.paymentSplits(),
    };
    this.dialogRef.close(result);
  }

  private recalcSplitTotal(): void {
    this.splitTotal.set(this.paymentSplits().reduce((sum, s) => sum + s.amount, 0));
  }
}
