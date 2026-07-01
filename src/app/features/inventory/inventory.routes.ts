import { Routes } from '@angular/router';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { ProductListComponent } from './components/product-list.component';
import { ProductFormComponent } from './components/product-form.component';
import { productReducer } from './store/product.reducer';
import { ProductEffects } from './store/product.effects';

export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    providers: [
      provideState('products', productReducer),
      provideEffects(ProductEffects),
    ],
    children: [
      { path: '', component: ProductListComponent },
      { path: 'new', component: ProductFormComponent },
      { path: ':id/edit', component: ProductFormComponent },
    ],
  },
];
