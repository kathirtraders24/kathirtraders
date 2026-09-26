import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReportResponse {
  from?: string;
  to?: string;
  rows: Record<string, any>[];
  [key: string]: any;
}

export type ReportType =
  | 'sales'
  | 'purchases'
  | 'stock'
  | 'gst'
  | 'customer-ledger'
  | 'supplier-ledger';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + '/reports';

  fetch(type: ReportType, from?: string, to?: string): Observable<ReportResponse> {
    const params: Record<string, string> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.http.get<ReportResponse>(`${this.baseUrl}/${type}`, { params });
  }
}
