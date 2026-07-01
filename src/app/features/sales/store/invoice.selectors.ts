import { createFeatureSelector, createSelector } from '@ngrx/store';
import { InvoiceState, invoiceAdapter } from './invoice.reducer';

export const selectInvoiceState = createFeatureSelector<InvoiceState>('invoices');

const { selectAll, selectEntities, selectTotal } = invoiceAdapter.getSelectors();

export const selectAllInvoices = createSelector(selectInvoiceState, selectAll);
export const selectInvoiceEntities = createSelector(selectInvoiceState, selectEntities);
export const selectInvoiceCount = createSelector(selectInvoiceState, selectTotal);
export const selectInvoicesLoading = createSelector(selectInvoiceState, (s) => s.loading);

export const selectInvoiceById = (id: string) =>
  createSelector(selectInvoiceEntities, (entities) => entities[id]);

export const selectInvoicesByStatus = (status: string) =>
  createSelector(selectAllInvoices, (invoices) =>
    invoices.filter((i) => i.status === status)
  );
