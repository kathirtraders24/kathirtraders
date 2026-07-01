import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { SalesInvoice } from '../../../shared/models';

export const InvoiceActions = createActionGroup({
  source: 'Invoice',
  events: {
    'Load Invoices': emptyProps(),
    'Load Invoices Success': props<{ invoices: SalesInvoice[] }>(),
    'Load Invoices Failure': props<{ error: string }>(),
    'Create Invoice': props<{ invoice: Omit<SalesInvoice, 'id' | 'invoiceNumber'> }>(),
    'Create Invoice Success': props<{ invoice: SalesInvoice }>(),
    'Create Invoice Failure': props<{ error: string }>(),
    'Confirm Invoice': props<{ id: string }>(),
    'Confirm Invoice Success': props<{ invoice: SalesInvoice }>(),
    'Confirm Invoice Failure': props<{ error: string }>(),
    'Cancel Invoice': props<{ id: string }>(),
    'Cancel Invoice Success': props<{ invoice: SalesInvoice }>(),
    'Cancel Invoice Failure': props<{ error: string }>(),
  },
});
