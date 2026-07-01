import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError } from 'rxjs/operators';
import { InvoiceActions } from './invoice.actions';
import { InvoiceService } from '../services/invoice.service';

@Injectable()
export class InvoiceEffects {
  private actions$ = inject(Actions);
  private invoiceService = inject(InvoiceService);

  loadInvoices$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InvoiceActions.loadInvoices),
      exhaustMap(() =>
        this.invoiceService.getAll().pipe(
          map((invoices) => InvoiceActions.loadInvoicesSuccess({ invoices })),
          catchError((err) =>
            of(InvoiceActions.loadInvoicesFailure({ error: err.message }))
          )
        )
      )
    )
  );

  createInvoice$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InvoiceActions.createInvoice),
      exhaustMap(({ invoice }) =>
        this.invoiceService.create(invoice).pipe(
          map((created) => InvoiceActions.createInvoiceSuccess({ invoice: created })),
          catchError((err) =>
            of(InvoiceActions.createInvoiceFailure({ error: err.message }))
          )
        )
      )
    )
  );

  confirmInvoice$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InvoiceActions.confirmInvoice),
      exhaustMap(({ id }) =>
        this.invoiceService.confirm(id).pipe(
          map((invoice) => InvoiceActions.confirmInvoiceSuccess({ invoice })),
          catchError((err) =>
            of(InvoiceActions.confirmInvoiceFailure({ error: err.message }))
          )
        )
      )
    )
  );

  cancelInvoice$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InvoiceActions.cancelInvoice),
      exhaustMap(({ id }) =>
        this.invoiceService.cancel(id).pipe(
          map((invoice) => InvoiceActions.cancelInvoiceSuccess({ invoice })),
          catchError((err) =>
            of(InvoiceActions.cancelInvoiceFailure({ error: err.message }))
          )
        )
      )
    )
  );
}
