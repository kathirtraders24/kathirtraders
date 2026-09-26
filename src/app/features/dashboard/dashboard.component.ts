import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { PaisePipe } from '../../shared/pipes/paise.pipe';
import { CountUpDirective } from '../../shared/directives/count-up.directive';
import { SpotlightDirective } from '../../shared/directives/spotlight.directive';
import { DashboardService, DashboardSummary, RevenuePoint } from './dashboard.service';
import { NotificationService } from '../../core/services/notification.service';

interface SummaryCard {
  title: string;
  subtitle: string;
  raw: number | null;               // numeric value for the count-up animation
  format: 'number' | 'currency';
  icon: string;
  color: string;
  route: string;
}

interface QuickAction {
  label: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatProgressBarModule, RouterLink, PaisePipe, CountUpDirective, SpotlightDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private notify = inject(NotificationService);

  loading = signal(true);
  summary = signal<DashboardSummary | null>(null);
  hoveredDate = signal<string | null>(null);

  quickActions: QuickAction[] = [
    { label: 'New Invoice', icon: 'point_of_sale', route: '/sales/new', color: '#4caf50' },
    { label: 'New POS Bill', icon: 'shopping_cart', route: '/purchases', color: '#ff9800' },
    { label: 'New Estimation', icon: 'request_quote', route: '/estimations', color: '#5c6bc0' },
    { label: 'Add Product', icon: 'add_box', route: '/inventory/new', color: '#00bcd4' },
  ];

  summaryCards = computed<SummaryCard[]>(() => {
    const s = this.summary();
    return [
      { title: 'Products', subtitle: 'Total items in catalog', raw: s ? s.productsCount : null, format: 'number', icon: 'inventory_2', color: '#3f51b5', route: '/inventory' },
      { title: "Today's Sales", subtitle: 'Revenue today', raw: s ? Math.round(s.todaySales / 100) : null, format: 'currency', icon: 'point_of_sale', color: '#4caf50', route: '/sales' },
      { title: 'Pending Orders', subtitle: 'Purchase orders in progress', raw: s ? s.pendingOrders : null, format: 'number', icon: 'shopping_cart', color: '#ff9800', route: '/purchases' },
      { title: 'Customers', subtitle: 'Active customers', raw: s ? s.customersCount : null, format: 'number', icon: 'people', color: '#9c27b0', route: '/customers' },
      { title: 'Low Stock', subtitle: 'Items below reorder level', raw: s ? s.lowStockCount : null, format: 'number', icon: 'warning', color: '#f44336', route: '/inventory' },
      { title: 'Suppliers', subtitle: 'Registered suppliers', raw: s ? s.suppliersCount : null, format: 'number', icon: 'local_shipping', color: '#00bcd4', route: '/suppliers' },
    ];
  });

  // 7-day revenue bar chart geometry (single-series magnitude-over-time)
  readonly chart = { width: 640, height: 180, padTop: 16, padBottom: 28, padX: 8, gap: 14 };

  bars = computed(() => {
    const series = this.summary()?.revenueSeries ?? [];
    if (series.length === 0) return [];
    const { width, height, padTop, padBottom, padX, gap } = this.chart;
    const max = Math.max(...series.map((p) => p.total), 1);
    const plotH = height - padTop - padBottom;
    const slot = (width - padX * 2) / series.length;
    const barW = slot - gap;
    return series.map((p, i) => {
      const h = Math.max((p.total / max) * plotH, p.total > 0 ? 3 : 0);
      return {
        x: padX + i * slot + gap / 2,
        y: padTop + (plotH - h),
        w: barW,
        h,
        point: p,
        label: this.dayLabel(p.date),
      };
    });
  });

  ngOnInit(): void {
    this.dashboardService.getSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Could not load dashboard data');
      },
    });
  }

  trackByPoint(_: number, b: { point: RevenuePoint }): string {
    return b.point.date;
  }

  private dayLabel(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { weekday: 'short' });
  }
}
