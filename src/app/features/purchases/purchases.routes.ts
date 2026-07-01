import { Routes } from '@angular/router';
import { PurchaseFormComponent } from './components/purchase-form.component';
import { OrdersListComponent } from './ordersDetails/orders-list.component';

export const PURCHASES_ROUTES: Routes = [
  { path: '', component: PurchaseFormComponent },
  { path: 'orders', component: OrdersListComponent },
];
