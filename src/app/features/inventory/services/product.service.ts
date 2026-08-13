import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map } from 'rxjs';
import { Product } from '../../../shared/models';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + '/products';
  private readonly jsonUrl = 'data/products.json';

  private cachedProducts: Product[] | null = null;

  private toProduct(dto: any): Product {
    return {
      id: dto.id,
      sku: dto.sku,
      name: dto.name,
      category: dto.category,
      subCategory: dto.sub_category ?? dto.subCategory ?? '',
      unit: dto.unit,
      hsnCode: dto.hsn_code ?? dto.hsnCode ?? '',
      gstRate: Number(dto.gst_rate ?? dto.gstRate ?? 0),
      unitPrice: Number(dto.unit_price ?? dto.unitPrice ?? 0),
      description: dto.description ?? undefined,
    };
  }

  private toApiPayload(product: Partial<Product> & Record<string, any>) {
    const payload: Record<string, any> = { ...product };

    if ('subCategory' in payload) {
      payload['sub_category'] = payload['subCategory'];
      delete payload['subCategory'];
    }

    if ('hsnCode' in payload) {
      payload['hsn_code'] = payload['hsnCode'];
      delete payload['hsnCode'];
    }

    if ('gstRate' in payload) {
      payload['gst_rate'] = payload['gstRate'];
      delete payload['gstRate'];
    }

    if ('unitPrice' in payload) {
      payload['unit_price'] = payload['unitPrice'];
      delete payload['unitPrice'];
    }

    return payload;
  }

  getAll(): Observable<Product[]> {
    if (environment.localJson) {
      if (this.cachedProducts) {
        return of(this.cachedProducts);
      }
      return this.http.get<Product[]>(this.jsonUrl).pipe(
        map((products) => {
          this.cachedProducts = products;
          return products;
        }),
      );
    }
    return this.http.get<any[]>(this.baseUrl).pipe(map((items) => items.map((item) => this.toProduct(item))));
  }

  getById(id: string): Observable<Product> {
    if (environment.localJson) {
      return this.getAll().pipe(
        map((products) => {
          const product = products.find((p) => p.id === id);
          if (!product) throw new Error(`Product not found: ${id}`);
          return product;
        }),
      );
    }
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(map((item) => this.toProduct(item)));
  }

  create(product: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<any>(this.baseUrl, this.toApiPayload(product)).pipe(map((item) => this.toProduct(item)));
  }

  update(id: string, product: Partial<Product>): Observable<Product> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, this.toApiPayload(product)).pipe(map((item) => this.toProduct(item)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  search(query: string): Observable<Product[]> {
    if (environment.localJson) {
      const term = query.toLowerCase();
      return this.getAll().pipe(
        map((products) =>
          products.filter(
            (p) =>
              p.name.toLowerCase().includes(term) ||
              p.sku.toLowerCase().includes(term) ||
              p.category.toLowerCase().includes(term) ||
              p.hsnCode.includes(term)
          )
        ),
      );
    }
    return this.http.get<any[]>(this.baseUrl, { params: { q: query } }).pipe(map((items) => items.map((item) => this.toProduct(item))));
  }
}
