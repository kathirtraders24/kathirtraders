import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Order } from '../../../shared/models';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/orders`;
  private readonly storageKey = 'kt_orders';

  placeOrder(order: Order): Observable<Order> {
    if (environment.localJson) {
      const raw = localStorage.getItem(this.storageKey);
      const orders: Order[] = raw ? JSON.parse(raw) : [];
      orders.unshift(order);
      localStorage.setItem(this.storageKey, JSON.stringify(orders));
      return of(order);
    }
    return this.http.post<Order>(this.baseUrl, order);
  }

  getAll(): Observable<Order[]> {
    if (environment.localJson) {
      const raw = localStorage.getItem(this.storageKey);
      return of(raw ? JSON.parse(raw) : []);
    }
    return this.http.get<Order[]>(this.baseUrl);
  }

  getById(id: string): Observable<Order> {
    if (environment.localJson) {
      const raw = localStorage.getItem(this.storageKey);
      const orders: Order[] = raw ? JSON.parse(raw) : [];
      const order = orders.find((o) => o.id === id);
      if (!order) throw new Error(`Order not found: ${id}`);
      return of(order);
    }
    return this.http.get<Order>(`${this.baseUrl}/${id}`);
  }
}
