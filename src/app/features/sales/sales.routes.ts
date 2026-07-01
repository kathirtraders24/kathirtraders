import { Routes } from '@angular/router';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { InvoiceListComponent } from './components/invoice-list.component';
import { InvoiceFormComponent } from './components/invoice-form.component';
import { invoiceReducer } from './store/invoice.reducer';
import { InvoiceEffects } from './store/invoice.effects';

export const SALES_ROUTES: Routes = [
  {
    path: '',
    providers: [
      provideState('invoices', invoiceReducer),
      provideEffects(InvoiceEffects),
    ],
    children: [
      { path: '', component: InvoiceListComponent },
      { path: 'new', component: InvoiceFormComponent },
    ],
  },
];
