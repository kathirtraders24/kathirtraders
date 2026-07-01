import { Routes } from '@angular/router';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { SupplierListComponent } from './components/supplier-list.component';
import { SupplierFormComponent } from './components/supplier-form.component';
import { supplierReducer } from './store/supplier.reducer';
import { SupplierEffects } from './store/supplier.effects';

export const SUPPLIERS_ROUTES: Routes = [
  {
    path: '',
    providers: [
      provideState('suppliers', supplierReducer),
      provideEffects(SupplierEffects),
    ],
    children: [
      { path: '', component: SupplierListComponent },
      { path: 'new', component: SupplierFormComponent },
      { path: ':id/edit', component: SupplierFormComponent },
    ],
  },
];
