import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Order } from '../../../shared/models';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/orders`;
  private readonly storageKey = 'kt_orders';

  placeOrder(order: Order): Observable<Order> {
    const payload = this.toApiPayload(order);

    if (environment.localJson) {
      const raw = localStorage.getItem(this.storageKey);
      const orders: Order[] = raw ? JSON.parse(raw) : [];
      orders.unshift(order);
      localStorage.setItem(this.storageKey, JSON.stringify(orders));
      return of(order);
    }

    return this.http.post<Order>(this.baseUrl, payload).pipe(map((response) => this.fromApiOrder(response)));
  }

  getAll(): Observable<Order[]> {
    if (environment.localJson) {
      const raw = localStorage.getItem(this.storageKey);
      return of(raw ? JSON.parse(raw) : []);
    }

    return this.http.get<any[]>(this.baseUrl).pipe(
      map((orders) => orders.map((order) => this.fromApiOrder(order)))
    );
  }

  getById(id: string): Observable<Order> {
    if (environment.localJson) {
      const raw = localStorage.getItem(this.storageKey);
      const orders: Order[] = raw ? JSON.parse(raw) : [];
      const order = orders.find((o) => o.id === id);
      if (!order) throw new Error(`Order not found: ${id}`);
      return of(order);
    }

    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map((order) => this.fromApiOrder(order))
    );
  }

  private toApiPayload(order: Order): Record<string, unknown> {
    return {
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      date: order.date,
      lines: order.lines.map((line) => ({
        product_id: line.productId,
        name: line.name,
        hsn_code: line.hsnCode,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        discount: line.discount,
        total_price: line.totalPrice,
      })),
      grand_total: order.grandTotal,
      payment_status: order.paymentStatus,
      payments: (order.payments ?? []).map((payment) => ({
        mode: payment.mode,
        amount: payment.amount,
      })),
    };
  }

  private fromApiOrder(order: any): Order {
    return {
      id: order.id,
      customerName: order.customer_name ?? order.customerName,
      customerPhone: order.customer_phone ?? order.customerPhone,
      date: order.date,
      lines: (order.lines ?? []).map((line: any) => ({
        productId: line.product_id ?? line.productId,
        name: line.name,
        hsnCode: line.hsn_code ?? line.hsnCode,
        quantity: line.quantity,
        unitPrice: line.unit_price ?? line.unitPrice,
        discount: line.discount ?? 0,
        totalPrice: line.total_price ?? line.totalPrice,
      })),
      grandTotal: order.grand_total ?? order.grandTotal,
      subtotal: order.subtotal,
      overallDiscount: order.overall_discount ?? order.overallDiscount,
      discountLabel: order.discount_label ?? order.discountLabel,
      paymentStatus: order.payment_status ?? order.paymentStatus,
      payments: (order.payments ?? []).map((payment: any) => ({
        mode: payment.mode,
        amount: payment.amount,
      })),
      createdAt: order.created_at ?? order.createdAt,
    };
  }
}
