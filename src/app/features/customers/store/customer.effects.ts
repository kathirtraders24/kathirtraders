import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError } from 'rxjs/operators';
import { CustomerActions } from './customer.actions';
import { CustomerService } from '../services/customer.service';

@Injectable()
export class CustomerEffects {
  private actions$ = inject(Actions);
  private customerService = inject(CustomerService);

  loadCustomers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CustomerActions.loadCustomers),
      exhaustMap(() =>
        this.customerService.getAll().pipe(
          map((customers) => CustomerActions.loadCustomersSuccess({ customers })),
          catchError((err) => of(CustomerActions.loadCustomersFailure({ error: err.message })))
        )
      )
    )
  );

  addCustomer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CustomerActions.addCustomer),
      exhaustMap(({ customer }) =>
        this.customerService.create(customer).pipe(
          map((created) => CustomerActions.addCustomerSuccess({ customer: created })),
          catchError((err) => of(CustomerActions.addCustomerFailure({ error: err.message })))
        )
      )
    )
  );

  updateCustomer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CustomerActions.updateCustomer),
      exhaustMap(({ id, changes }) =>
        this.customerService.update(id, changes).pipe(
          map((customer) => CustomerActions.updateCustomerSuccess({ customer })),
          catchError((err) => of(CustomerActions.updateCustomerFailure({ error: err.message })))
        )
      )
    )
  );

  deleteCustomer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CustomerActions.deleteCustomer),
      exhaustMap(({ id }) =>
        this.customerService.delete(id).pipe(
          map(() => CustomerActions.deleteCustomerSuccess({ id })),
          catchError((err) => of(CustomerActions.deleteCustomerFailure({ error: err.message })))
        )
      )
    )
  );
}
