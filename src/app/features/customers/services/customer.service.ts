import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Customer } from '../../../shared/models';
import { environment } from '../../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class CustomerService {
  private http = inject(HttpClient);
  public env = environment;
  private readonly baseUrl = this.env.apiUrl +'/customers';


  getAll(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.baseUrl);
  }

  getById(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.baseUrl}/${id}`);
  }

  create(customer: Omit<Customer, 'id'>): Observable<Customer> {
    return this.http.post<Customer>(this.baseUrl, customer);
  }

  update(id: string, customer: Partial<Customer>): Observable<Customer> {
    return this.http.put<Customer>(`${this.baseUrl}/${id}`, customer);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
