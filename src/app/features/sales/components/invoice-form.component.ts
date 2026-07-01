import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { InvoiceActions } from '../store/invoice.actions';
import { GstService, NotificationService } from '../../../core';
import { PaisePipe, PaymentMode, InvoiceLineItem } from '../../../shared';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatCardModule, MatIconModule,
    MatDividerModule, MatAutocompleteModule, PaisePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice-form.component.html',
  styleUrl: './invoice-form.component.scss',
})
export class InvoiceFormComponent {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private router = inject(Router);
  private gstService = inject(GstService);
  private notification = inject(NotificationService);

  form = this.fb.group({
    customerId: ['', Validators.required],
    customerName: ['', Validators.required],
    date: [new Date().toISOString().substring(0, 10), Validators.required],
    paymentMode: ['cash' as PaymentMode, Validators.required],
    lines: this.fb.array([]),
  });

  subTotal = signal(0);
  totalCgst = signal(0);
  totalSgst = signal(0);
  grandTotal = signal(0);

  get lineItems(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  addLine(): void {
    this.lineItems.push(
      this.fb.group({
        productId: [''],
        productName: ['', Validators.required],
        hsnCode: ['', Validators.required],
        quantity: [1, [Validators.required, Validators.min(1)]],
        unitRate: [0, [Validators.required, Validators.min(0)]],
        gstRate: [18, Validators.required],
        discount: [0],
      })
    );
  }

  removeLine(index: number): void {
    this.lineItems.removeAt(index);
    this.recalculate();
  }

  recalculate(): void {
    let sub = 0;
    let cgst = 0;
    let sgst = 0;

    for (const ctrl of this.lineItems.controls) {
      const val = ctrl.value;
      const lineTotal = Math.round((val.quantity ?? 0) * (val.unitRate ?? 0) * 100);
      const discount = Math.round((val.discount ?? 0) * 100);
      const taxable = lineTotal - discount;
      const tax = this.gstService.calculateTax(taxable, val.gstRate ?? 18, '33');
      sub += taxable;
      cgst += tax.cgst;
      sgst += tax.sgst;
    }

    this.subTotal.set(sub);
    this.totalCgst.set(cgst);
    this.totalSgst.set(sgst);
    this.grandTotal.set(sub + cgst + sgst);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.recalculate();
    const raw = this.form.getRawValue();

    const lines: InvoiceLineItem[] = raw.lines.map((l: any) => {
      const lineTotal = Math.round(l.quantity * l.unitRate * 100);
      const discount = Math.round((l.discount ?? 0) * 100);
      const taxable = lineTotal - discount;
      const tax = this.gstService.calculateTax(taxable, l.gstRate, '33');
      return {
        productId: l.productId,
        productName: l.productName,
        hsnCode: l.hsnCode,
        quantity: l.quantity,
        unitRate: Math.round(l.unitRate * 100),
        discount,
        gstRate: l.gstRate,
        cgst: tax.cgst,
        sgst: tax.sgst,
        igst: tax.igst,
        lineTotal: taxable + tax.totalTax,
      };
    });

    const invoice = {
      date: raw.date!,
      customerId: raw.customerId!,
      customerName: raw.customerName!,
      lines,
      subTotal: this.subTotal(),
      totalCgst: this.totalCgst(),
      totalSgst: this.totalSgst(),
      totalIgst: 0,
      grandTotal: this.grandTotal(),
      paymentMode: raw.paymentMode as PaymentMode,
      status: 'draft' as const,
    };

    this.store.dispatch(InvoiceActions.createInvoice({ invoice }));
    this.notification.success('Invoice saved as draft');
    this.router.navigate(['/sales']);
  }

  cancel(): void {
    this.router.navigate(['/sales']);
  }
}
