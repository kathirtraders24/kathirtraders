import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatGridListModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  summaryCards = [
    { title: 'Products', subtitle: 'Total items in catalog', value: '—', icon: 'inventory_2', color: '#3f51b5', route: '/inventory' },
    { title: 'Today\'s Sales', subtitle: 'Revenue today', value: '—', icon: 'point_of_sale', color: '#4caf50', route: '/sales' },
    { title: 'Pending Orders', subtitle: 'Purchase orders in progress', value: '—', icon: 'shopping_cart', color: '#ff9800', route: '/purchases' },
    { title: 'Customers', subtitle: 'Active customers', value: '—', icon: 'people', color: '#9c27b0', route: '/customers' },
    { title: 'Low Stock', subtitle: 'Items below reorder level', value: '—', icon: 'warning', color: '#f44336', route: '/inventory' },
    { title: 'Suppliers', subtitle: 'Registered suppliers', value: '—', icon: 'local_shipping', color: '#00bcd4', route: '/suppliers' },
  ];
}
