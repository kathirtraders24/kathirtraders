import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { ReportType } from './report.service';

interface ReportCard {
  title: string;
  description: string;
  icon: string;
  color: string;
  type: ReportType;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent {
  reports: ReportCard[] = [
    { title: 'Sales Report', description: 'Daily sales summary with POS and tax-invoice split', icon: 'trending_up', color: '#4caf50', type: 'sales' },
    { title: 'Purchase Report', description: 'Purchase orders and goods received summary', icon: 'shopping_cart', color: '#2196f3', type: 'purchases' },
    { title: 'Stock Report', description: 'Current stock levels, low-stock, inventory valuation', icon: 'inventory_2', color: '#ff9800', type: 'stock' },
    { title: 'GST Report', description: 'Output tax summary grouped by GST rate', icon: 'receipt_long', color: '#9c27b0', type: 'gst' },
    { title: 'Customer Ledger', description: 'Outstanding balances per customer', icon: 'people', color: '#f44336', type: 'customer-ledger' },
    { title: 'Supplier Ledger', description: 'Payables and purchase history per supplier', icon: 'local_shipping', color: '#00bcd4', type: 'supplier-ledger' },
  ];
}
