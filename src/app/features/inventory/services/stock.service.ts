import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StockEntry } from '../../../shared/models';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StockService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + '/stock';

  getAll(): Observable<StockEntry[]> {
    return this.http.get<StockEntry[]>(this.baseUrl);
  }

  getByProduct(productId: string): Observable<StockEntry[]> {
    return this.http.get<StockEntry[]>(`${this.baseUrl}/product/${productId}`);
  }

  checkAvailability(productId: string, quantity: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/check`, {
      params: { productId, quantity: quantity.toString() },
    });
  }

  adjustStock(entry: { productId: string; quantity: number; reason: string }): Observable<StockEntry> {
    return this.http.post<StockEntry>(`${this.baseUrl}/adjust`, entry);
  }

  getLowStock(): Observable<StockEntry[]> {
    return this.http.get<StockEntry[]>(`${this.baseUrl}/low`);
  }
}
