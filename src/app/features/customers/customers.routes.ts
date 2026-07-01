import { Routes } from '@angular/router';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { CustomerListComponent } from './components/customer-list.component';
import { CustomerFormComponent } from './components/customer-form.component';
import { customerReducer } from './store/customer.reducer';
import { CustomerEffects } from './store/customer.effects';

export const CUSTOMERS_ROUTES: Routes = [
  {
    path: '',
    providers: [
      provideState('customers', customerReducer),
      provideEffects(CustomerEffects),
    ],
    children: [
      { path: '', component: CustomerListComponent },
      { path: 'new', component: CustomerFormComponent },
      { path: ':id/edit', component: CustomerFormComponent },
    ],
  },
];
