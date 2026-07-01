import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AsyncPipe, DatePipe } from '@angular/common';
import { PurchaseActions } from '../store/purchase.actions';
import { selectAllPurchases, selectPurchasesLoading } from '../store/purchase.selectors';
import { PaisePipe } from '../../../shared';

@Component({
  selector: 'app-purchase-list',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatProgressBarModule, AsyncPipe, DatePipe, PaisePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './purchase-list.component.html',
  styleUrl: './purchase-list.component.scss',
})
export class PurchaseListComponent implements OnInit {
  private store = inject(Store);
  private router = inject(Router);

  purchases$ = this.store.select(selectAllPurchases);
  loading$ = this.store.select(selectPurchasesLoading);
  displayedColumns = ['poNumber', 'date', 'supplierName', 'totalAmount', 'status', 'actions'];

  ngOnInit(): void {
    this.store.dispatch(PurchaseActions.loadPurchases());
  }

  createPO(): void {
    this.router.navigate(['/purchases', 'new']);
  }

  markReceived(id: string): void {
    this.store.dispatch(PurchaseActions.receivePurchase({ id }));
  }
}
