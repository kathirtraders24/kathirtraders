import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Estimation } from '../../../shared/models';
import { toSnakeCase, toCamelCase } from '../../../shared';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EstimationService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + '/estimations';

  getAll(): Observable<Estimation[]> {
    return this.http
      .get<unknown[]>(this.baseUrl)
      .pipe(map((items) => items.map((i) => toCamelCase<Estimation>(i))));
  }

  getById(id: string): Observable<Estimation> {
    return this.http
      .get<unknown>(`${this.baseUrl}/${id}`)
      .pipe(map((e) => toCamelCase<Estimation>(e)));
  }

  getByNumber(estimationNumber: string): Observable<Estimation> {
    return this.http
      .get<unknown>(`${this.baseUrl}/by-number/${encodeURIComponent(estimationNumber)}`)
      .pipe(map((e) => toCamelCase<Estimation>(e)));
  }

  create(estimation: Omit<Estimation, 'id' | 'estimationNumber'>): Observable<Estimation> {
    return this.http
      .post<unknown>(this.baseUrl, toSnakeCase(estimation))
      .pipe(map((e) => toCamelCase<Estimation>(e)));
  }

  update(id: string, changes: Partial<Estimation>): Observable<Estimation> {
    return this.http
      .patch<unknown>(`${this.baseUrl}/${id}`, toSnakeCase(changes))
      .pipe(map((e) => toCamelCase<Estimation>(e)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
