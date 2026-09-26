import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import { ReportService, ReportType, ReportResponse } from './report.service';
import { NotificationService } from '../../core/services/notification.service';
import { downloadCsv } from '../../shared/utils/csv-export';
import { SHOP } from '../../shared/constants/shop';

type ColType = 'text' | 'money' | 'number' | 'date' | 'bool';

interface Column {
  key: string;
  label: string;
  type: ColType;
}

interface ReportConfig {
  type: ReportType;
  title: string;
  hasDateRange: boolean;
  columns: Column[];
  summary: { key: string; label: string; type: ColType }[];
}

const REPORTS: Record<ReportType, ReportConfig> = {
  sales: {
    type: 'sales', title: 'Sales Report', hasDateRange: true,
    columns: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'pos_bills', label: 'POS Bills', type: 'number' },
      { key: 'tax_invoices', label: 'Tax Invoices', type: 'number' },
      { key: 'pos_total', label: 'POS Total', type: 'money' },
      { key: 'invoice_total', label: 'Invoice Total', type: 'money' },
      { key: 'total', label: 'Total', type: 'money' },
    ],
    summary: [
      { key: 'transactions', label: 'Transactions', type: 'number' },
      { key: 'grand_total', label: 'Grand Total', type: 'money' },
    ],
  },
  purchases: {
    type: 'purchases', title: 'Purchase Report', hasDateRange: true,
    columns: [
      { key: 'po_number', label: 'PO Number', type: 'text' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'supplier_name', label: 'Supplier', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'total_amount', label: 'Amount', type: 'money' },
    ],
    summary: [{ key: 'grand_total', label: 'Total Purchases', type: 'money' }],
  },
  stock: {
    type: 'stock', title: 'Stock Report', hasDateRange: false,
    columns: [
      { key: 'sku', label: 'SKU', type: 'text' },
      { key: 'name', label: 'Product', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'quantity', label: 'Qty', type: 'number' },
      { key: 'reorder_level', label: 'Reorder', type: 'number' },
      { key: 'unit_price', label: 'Unit Price', type: 'money' },
      { key: 'value', label: 'Stock Value', type: 'money' },
    ],
    summary: [
      { key: 'low_stock_count', label: 'Low Stock Items', type: 'number' },
      { key: 'total_value', label: 'Inventory Value', type: 'money' },
    ],
  },
  gst: {
    type: 'gst', title: 'GST Report', hasDateRange: true,
    columns: [
      { key: 'gst_rate', label: 'GST %', type: 'number' },
      { key: 'taxable', label: 'Taxable Value', type: 'money' },
      { key: 'cgst', label: 'CGST', type: 'money' },
      { key: 'sgst', label: 'SGST', type: 'money' },
      { key: 'igst', label: 'IGST', type: 'money' },
      { key: 'total_tax', label: 'Total Tax', type: 'money' },
    ],
    summary: [{ key: 'total_tax', label: 'Total Tax Collected', type: 'money' }],
  },
  'customer-ledger': {
    type: 'customer-ledger', title: 'Customer Ledger', hasDateRange: false,
    columns: [
      { key: 'name', label: 'Customer', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'credit_limit', label: 'Credit Limit', type: 'money' },
      { key: 'outstanding_balance', label: 'Outstanding', type: 'money' },
    ],
    summary: [{ key: 'total_outstanding', label: 'Total Outstanding', type: 'money' }],
  },
  'supplier-ledger': {
    type: 'supplier-ledger', title: 'Supplier Ledger', hasDateRange: false,
    columns: [
      { key: 'name', label: 'Supplier', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'payment_terms', label: 'Terms', type: 'text' },
      { key: 'payable', label: 'Payable', type: 'money' },
    ],
    summary: [{ key: 'total_payable', label: 'Total Payable', type: 'money' }],
  },
};

@Component({
  selector: 'app-report-viewer',
  standalone: true,
  imports: [
    RouterLink, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule,
    MatProgressBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './report-viewer.component.html',
  styleUrl: './report-viewer.component.scss',
})
export class ReportViewerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private reportService = inject(ReportService);
  private notify = inject(NotificationService);

  config = signal<ReportConfig | null>(null);
  data = signal<ReportResponse | null>(null);
  loading = signal(false);

  from = signal<Date>(this.startOfMonth());
  to = signal<Date>(new Date());

  displayedColumns = computed(() => this.config()?.columns.map((c) => c.key) ?? []);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const type = params.get('type') as ReportType;
      const cfg = REPORTS[type];
      if (!cfg) {
        this.notify.error('Unknown report type');
        return;
      }
      this.config.set(cfg);
      this.load();
    });
  }

  load(): void {
    const cfg = this.config();
    if (!cfg) return;
    this.loading.set(true);
    const from = cfg.hasDateRange ? this.toIso(this.from()) : undefined;
    const to = cfg.hasDateRange ? this.toIso(this.to()) : undefined;
    this.reportService.fetch(cfg.type, from, to).subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Could not load report');
      },
    });
  }

  format(value: any, type: ColType): string {
    if (value == null) return '';
    switch (type) {
      case 'money': return '₹' + (Number(value) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      case 'date': return new Date(value).toLocaleDateString('en-IN');
      case 'bool': return value ? 'Yes' : 'No';
      default: return String(value);
    }
  }

  exportCsv(): void {
    const cfg = this.config();
    const rows = this.data()?.rows ?? [];
    if (!cfg || rows.length === 0) {
      this.notify.warning('Nothing to export');
      return;
    }
    const headers = cfg.columns.map((c) => c.label);
    const body = rows.map((row) =>
      cfg.columns.map((c) => (c.type === 'money' ? (Number(row[c.key] ?? 0) / 100).toFixed(2) : (row[c.key] ?? ''))),
    );
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`${cfg.title.replace(/\s+/g, '-').toLowerCase()}-${stamp}`, headers, body);
  }

  print(): void {
    window.print();
  }

  shopName = SHOP.name;

  private startOfMonth(): Date {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  private toIso(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
