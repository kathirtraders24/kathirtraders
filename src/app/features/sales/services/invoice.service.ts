import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SalesInvoice } from '../../../shared/models';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + '/invoices';

  getAll(): Observable<SalesInvoice[]> {
    return this.http.get<SalesInvoice[]>(this.baseUrl);
  }

  getById(id: string): Observable<SalesInvoice> {
    return this.http.get<SalesInvoice>(`${this.baseUrl}/${id}`);
  }

  create(invoice: Omit<SalesInvoice, 'id' | 'invoiceNumber'>): Observable<SalesInvoice> {
    return this.http.post<SalesInvoice>(this.baseUrl, invoice);
  }

  confirm(id: string): Observable<SalesInvoice> {
    return this.http.post<SalesInvoice>(`${this.baseUrl}/${id}/confirm`, {});
  }

  cancel(id: string): Observable<SalesInvoice> {
    return this.http.post<SalesInvoice>(`${this.baseUrl}/${id}/cancel`, {});
  }
}
