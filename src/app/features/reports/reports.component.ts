import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatDividerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent {
  reports = [
    {
      title: 'Sales Report',
      description: 'Daily, weekly, monthly sales summary with GST breakup',
      icon: 'trending_up',
      color: '#4caf50',
    },
    {
      title: 'Purchase Report',
      description: 'Purchase orders and goods received summary',
      icon: 'shopping_cart',
      color: '#2196f3',
    },
    {
      title: 'Stock Report',
      description: 'Current stock levels, low-stock alerts, inventory valuation',
      icon: 'inventory_2',
      color: '#ff9800',
    },
    {
      title: 'GST Report',
      description: 'GSTR-1 / GSTR-3B compatible tax summary',
      icon: 'receipt_long',
      color: '#9c27b0',
    },
    {
      title: 'Customer Ledger',
      description: 'Outstanding balances and payment history per customer',
      icon: 'people',
      color: '#f44336',
    },
    {
      title: 'Supplier Ledger',
      description: 'Payables and purchase history per supplier',
      icon: 'local_shipping',
      color: '#00bcd4',
    },
  ];
}
