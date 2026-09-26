import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { SalesInvoice } from '../../../shared/models';
import { toSnakeCase, toCamelCase } from '../../../shared';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + '/invoices';

  getAll(): Observable<SalesInvoice[]> {
    return this.http
      .get<unknown[]>(this.baseUrl)
      .pipe(map((items) => items.map((i) => toCamelCase<SalesInvoice>(i))));
  }

  getById(id: string): Observable<SalesInvoice> {
    return this.http
      .get<unknown>(`${this.baseUrl}/${id}`)
      .pipe(map((i) => toCamelCase<SalesInvoice>(i)));
  }

  getByNumber(invoiceNumber: string): Observable<SalesInvoice> {
    return this.http
      .get<unknown>(`${this.baseUrl}/by-number/${encodeURIComponent(invoiceNumber)}`)
      .pipe(map((i) => toCamelCase<SalesInvoice>(i)));
  }

  create(invoice: Omit<SalesInvoice, 'id' | 'invoiceNumber'>): Observable<SalesInvoice> {
    return this.http
      .post<unknown>(this.baseUrl, toSnakeCase(invoice))
      .pipe(map((i) => toCamelCase<SalesInvoice>(i)));
  }

  update(id: string, changes: Partial<SalesInvoice>): Observable<SalesInvoice> {
    return this.http
      .put<unknown>(`${this.baseUrl}/${id}`, toSnakeCase(changes))
      .pipe(map((i) => toCamelCase<SalesInvoice>(i)));
  }

  confirm(id: string): Observable<SalesInvoice> {
    return this.http
      .post<unknown>(`${this.baseUrl}/${id}/confirm`, {})
      .pipe(map((i) => toCamelCase<SalesInvoice>(i)));
  }

  cancel(id: string): Observable<SalesInvoice> {
    return this.http
      .post<unknown>(`${this.baseUrl}/${id}/cancel`, {})
      .pipe(map((i) => toCamelCase<SalesInvoice>(i)));
  }
}
