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
    return this.http.get<Product[]>(this.baseUrl);
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
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  create(product: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, product);
  }

  update(id: string, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, product);
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
    return this.http.get<Product[]>(this.baseUrl, { params: { q: query } });
  }
}
