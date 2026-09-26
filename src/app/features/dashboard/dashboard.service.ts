import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaiseAmount } from '../../shared/models';

export interface RevenuePoint {
  date: string;
  total: PaiseAmount;
}

export interface DashboardSummary {
  productsCount: number;
  todaySales: PaiseAmount;
  pendingOrders: number;
  customersCount: number;
  lowStockCount: number;
  suppliersCount: number;
  revenueSeries: RevenuePoint[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + '/dashboard';

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<any>(`${this.baseUrl}/summary`).pipe(
      map((dto) => ({
        productsCount: Number(dto.products_count ?? 0),
        todaySales: Number(dto.today_sales ?? 0),
        pendingOrders: Number(dto.pending_orders ?? 0),
        customersCount: Number(dto.customers_count ?? 0),
        lowStockCount: Number(dto.low_stock_count ?? 0),
        suppliersCount: Number(dto.suppliers_count ?? 0),
        revenueSeries: (dto.revenue_series ?? []).map((p: any) => ({
          date: p.date,
          total: Number(p.total ?? 0),
        })),
      })),
    );
  }
}
