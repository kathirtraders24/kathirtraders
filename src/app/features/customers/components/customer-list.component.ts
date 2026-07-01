import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { AsyncPipe } from '@angular/common';
import { CustomerActions } from '../store/customer.actions';
import { selectAllCustomers, selectCustomersLoading } from '../store/customer.selectors';
import { PaisePipe, Customer, ConfirmDialogComponent } from '../../../shared';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatProgressBarModule, AsyncPipe, PaisePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss',
})
export class CustomerListComponent implements OnInit {
  private store = inject(Store);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  customers$ = this.store.select(selectAllCustomers);
  loading$ = this.store.select(selectCustomersLoading);
  displayedColumns = ['name', 'phone', 'gstin', 'creditLimit', 'outstandingBalance', 'actions'];

  ngOnInit(): void {
    this.store.dispatch(CustomerActions.loadCustomers());
  }

  addCustomer(): void {
    this.router.navigate(['/customers', 'new']);
  }

  editCustomer(c: Customer): void {
    this.router.navigate(['/customers', c.id, 'edit']);
  }

  deleteCustomer(c: Customer): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Customer', message: `Delete "${c.name}"?`, confirmText: 'Delete' },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.store.dispatch(CustomerActions.deleteCustomer({ id: c.id }));
    });
  }
}
