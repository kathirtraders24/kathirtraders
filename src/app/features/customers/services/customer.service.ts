import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Customer } from '../../../shared/models';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private http = inject(HttpClient);
  public env = environment;
  private readonly baseUrl = this.env.apiUrl + '/customers';

  private toCustomer(dto: any): Customer {
    return {
      id: dto.id,
      name: dto.name,
      gstin: dto.gstin ?? undefined,
      phone: dto.phone,
      email: dto.email ?? undefined,
      address: dto.address,
      stateCode: dto.state_code ?? dto.stateCode ?? '',
      creditLimit: Number(dto.credit_limit ?? dto.creditLimit ?? 0),
      outstandingBalance: Number(dto.outstanding_balance ?? dto.outstandingBalance ?? 0),
    };
  }

  private toApiPayload(customer: Partial<Customer> & Record<string, any>) {
    const payload: Record<string, any> = { ...customer };

    if ('stateCode' in payload) {
      payload['state_code'] = payload['stateCode'];
      delete payload['stateCode'];
    }

    if ('creditLimit' in payload) {
      payload['credit_limit'] = payload['creditLimit'];
      delete payload['creditLimit'];
    }

    if ('outstandingBalance' in payload) {
      payload['outstanding_balance'] = payload['outstandingBalance'];
      delete payload['outstandingBalance'];
    }

    return payload;
  }

  getAll(): Observable<Customer[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(map((items) => items.map((item) => this.toCustomer(item))));
  }

  getById(id: string): Observable<Customer> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(map((item) => this.toCustomer(item)));
  }

  create(customer: Omit<Customer, 'id'>): Observable<Customer> {
    return this.http.post<any>(this.baseUrl, this.toApiPayload(customer)).pipe(map((item) => this.toCustomer(item)));
  }

  update(id: string, customer: Partial<Customer>): Observable<Customer> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, this.toApiPayload(customer)).pipe(map((item) => this.toCustomer(item)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
