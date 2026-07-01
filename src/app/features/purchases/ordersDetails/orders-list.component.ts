import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';
import { CurrencyPipe, UpperCasePipe } from '@angular/common';
import { Order, OrderPaymentStatus, BillPrintService } from '../../../shared';
import { OrderService } from '../services/order.service';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatTableModule, MatDividerModule, MatIconModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatMenuModule,
    MatDatepickerModule, MatNativeDateModule, MatBadgeModule,
    CurrencyPipe, UpperCasePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './orders-list.component.html',
  styleUrl: './orders-list.component.scss',
})
export class OrdersListComponent {
  private billPrintService = inject(BillPrintService);
  private orderService = inject(OrderService);

  private allOrders = signal<Order[]>([]);
  selectedOrder = signal<Order | null>(null);
  orderColumns = ['sno', 'customerName', 'customerPhone', 'date', 'grandTotal', 'paymentStatus', 'paymentModes', 'actions'];

  // Filter state
  searchTerm = signal('');
  selectedStatuses = signal<Set<OrderPaymentStatus>>(new Set());
  dateFrom = signal<Date | null>(null);
  dateTo = signal<Date | null>(null);

  dateFromCtrl = new FormControl<Date | null>(null);
  dateToCtrl = new FormControl<Date | null>(null);

  statusOptions: { value: OrderPaymentStatus; label: string }[] = [
    { value: 'paid', label: 'Paid' },
    { value: 'partial', label: 'Partial' },
    { value: 'unpaid', label: 'Unpaid' },
  ];

  constructor() {
    this.orderService.getAll().subscribe((orders) => this.allOrders.set(orders));
  }

  filteredOrders = computed(() => {
    let result = this.allOrders();
    const term = this.searchTerm().toLowerCase().trim();
    const statuses = this.selectedStatuses();
    const from = this.dateFrom();
    const to = this.dateTo();

    if (term) {
      result = result.filter((o) =>
        o.customerName.toLowerCase().includes(term) ||
        o.customerPhone.includes(term) ||
        o.id.toLowerCase().includes(term)
      );
    }

    if (statuses.size > 0) {
      result = result.filter((o) => statuses.has(o.paymentStatus));
    }

    if (from) {
      const fromStr = this.toDateStr(from);
      result = result.filter((o) => o.date >= fromStr);
    }

    if (to) {
      const toStr = this.toDateStr(to);
      result = result.filter((o) => o.date <= toStr);
    }

    return result;
  });

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.searchTerm().trim()) count++;
    if (this.selectedStatuses().size > 0) count++;
    if (this.dateFrom() || this.dateTo()) count++;
    return count;
  });

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.selectedOrder.set(null);
  }

  toggleStatus(status: OrderPaymentStatus): void {
    this.selectedStatuses.update((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
    this.selectedOrder.set(null);
  }

  isStatusSelected(status: OrderPaymentStatus): boolean {
    return this.selectedStatuses().has(status);
  }

  onDateFromChange(): void {
    this.dateFrom.set(this.dateFromCtrl.value);
    this.selectedOrder.set(null);
  }

  onDateToChange(): void {
    this.dateTo.set(this.dateToCtrl.value);
    this.selectedOrder.set(null);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedStatuses.set(new Set());
    this.dateFrom.set(null);
    this.dateTo.set(null);
    this.dateFromCtrl.reset();
    this.dateToCtrl.reset();
    this.selectedOrder.set(null);
  }

  selectOrder(order: Order): void {
    this.selectedOrder.set(this.selectedOrder()?.id === order.id ? null : order);
  }

  getPaymentModes(order: Order): string {
    if (order.payments.length === 0) return '—';
    return order.payments
      .map((p) => `${p.mode.toUpperCase()} ₹${(p.amount / 100).toFixed(2)}`)
      .join(', ');
  }

  printOrder(order: Order, event: Event): void {
    event.stopPropagation();
    const paymentInfo = order.payments.length > 0
      ? order.payments.map((p) => `${p.mode.toUpperCase()} \u20B9${(p.amount / 100).toFixed(2)}`).join(', ')
      : '—';

    this.billPrintService.print({
      title: 'Cash Bill/Tax Invoice',
      date: order.date,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
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
      paidAmount: order.paymentStatus === 'partial'
        ? order.payments.reduce((sum, p) => sum + p.amount, 0)
        : undefined,
      metaFields: [
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

  private toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
