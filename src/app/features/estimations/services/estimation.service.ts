import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Estimation } from '../../../shared/models';

@Injectable({ providedIn: 'root' })
export class EstimationService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/estimations';

  getAll(): Observable<Estimation[]> {
    return this.http.get<Estimation[]>(this.baseUrl);
  }

  getById(id: string): Observable<Estimation> {
    return this.http.get<Estimation>(`${this.baseUrl}/${id}`);
  }

  create(estimation: Omit<Estimation, 'id' | 'estimationNumber'>): Observable<Estimation> {
    return this.http.post<Estimation>(this.baseUrl, estimation);
  }

  update(id: string, changes: Partial<Estimation>): Observable<Estimation> {
    return this.http.patch<Estimation>(`${this.baseUrl}/${id}`, changes);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
