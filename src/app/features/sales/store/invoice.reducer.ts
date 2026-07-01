import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { SalesInvoice } from '../../../shared/models';
import { InvoiceActions } from './invoice.actions';

export interface InvoiceState extends EntityState<SalesInvoice> {
  loading: boolean;
  error: string | null;
}

export const invoiceAdapter = createEntityAdapter<SalesInvoice>();

const initialState: InvoiceState = invoiceAdapter.getInitialState({
  loading: false,
  error: null,
});

export const invoiceReducer = createReducer(
  initialState,
  on(InvoiceActions.loadInvoices, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(InvoiceActions.loadInvoicesSuccess, (state, { invoices }) =>
    invoiceAdapter.setAll(invoices, { ...state, loading: false })
  ),
  on(InvoiceActions.loadInvoicesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(InvoiceActions.createInvoiceSuccess, (state, { invoice }) =>
    invoiceAdapter.addOne(invoice, state)
  ),
  on(InvoiceActions.confirmInvoiceSuccess, (state, { invoice }) =>
    invoiceAdapter.upsertOne(invoice, state)
  ),
  on(InvoiceActions.cancelInvoiceSuccess, (state, { invoice }) =>
    invoiceAdapter.upsertOne(invoice, state)
  )
);
