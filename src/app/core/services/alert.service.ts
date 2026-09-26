import { Injectable, inject, signal, computed } from '@angular/core';
import { forkJoin, catchError, of } from 'rxjs';
import { StockService } from '../../features/inventory/services/stock.service';
import { CustomerService } from '../../features/customers/services/customer.service';

export type AlertType = 'low-stock' | 'payment-due';

export interface AlertItem {
  id: string;
  type: AlertType;
  icon: string;
  title: string;
  detail: string;
  route: string;
  color: string;
}

@Injectable({ providedIn: 'root' })
export class AlertService {
  private stockService = inject(StockService);
  private customerService = inject(CustomerService);

  private readonly _alerts = signal<AlertItem[]>([]);
  readonly alerts = this._alerts.asReadonly();
  readonly count = computed(() => this._alerts().length);

  refresh(): void {
    forkJoin({
      lowStock: this.stockService.getLowStock().pipe(catchError(() => of([]))),
      outstanding: this.customerService.getOutstanding().pipe(catchError(() => of([]))),
    }).subscribe(({ lowStock, outstanding }) => {
      const alerts: AlertItem[] = [];

      for (const entry of lowStock as any[]) {
        const name = entry?.product?.name ?? 'Product';
        const qty = entry?.quantity_on_hand ?? entry?.quantityOnHand ?? 0;
        const reorder = entry?.reorder_level ?? entry?.reorderLevel ?? 0;
        alerts.push({
          id: 'stock-' + (entry?.id ?? name),
          type: 'low-stock',
          icon: 'warning',
          title: name,
          detail: `Only ${qty} left (reorder at ${reorder})`,
          route: '/inventory',
          color: '#f44336',
        });
      }

      for (const c of outstanding) {
        alerts.push({
          id: 'due-' + c.id,
          type: 'payment-due',
          icon: 'account_balance_wallet',
          title: c.name,
          detail: `Outstanding ₹${(c.outstandingBalance / 100).toLocaleString('en-IN')}`,
          route: '/customers',
          color: '#ff9800',
        });
      }

      this._alerts.set(alerts);
    });
  }
}
