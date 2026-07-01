import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { AsyncPipe, DatePipe } from '@angular/common';
import { InvoiceActions } from '../store/invoice.actions';
import { selectAllInvoices, selectInvoicesLoading } from '../store/invoice.selectors';
import { PaisePipe, SalesInvoice, ConfirmDialogComponent } from '../../../shared';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatProgressBarModule, AsyncPipe, DatePipe, PaisePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.scss',
})
export class InvoiceListComponent implements OnInit {
  private store = inject(Store);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  invoices$ = this.store.select(selectAllInvoices);
  loading$ = this.store.select(selectInvoicesLoading);
  displayedColumns = ['invoiceNumber', 'date', 'customerName', 'grandTotal', 'status', 'actions'];

  ngOnInit(): void {
    this.store.dispatch(InvoiceActions.loadInvoices());
  }

  createInvoice(): void {
    this.router.navigate(['/sales', 'new']);
  }

  viewInvoice(inv: SalesInvoice): void {
    this.router.navigate(['/sales', inv.id]);
  }

  confirmInvoice(inv: SalesInvoice): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirm Invoice',
        message: `Confirm invoice ${inv.invoiceNumber}? Stock will be deducted.`,
        confirmText: 'Confirm',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.store.dispatch(InvoiceActions.confirmInvoice({ id: inv.id }));
      }
    });
  }

  cancelInvoice(inv: SalesInvoice): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancel Invoice',
        message: `Cancel invoice ${inv.invoiceNumber}?`,
        confirmText: 'Cancel Invoice',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.store.dispatch(InvoiceActions.cancelInvoice({ id: inv.id }));
      }
    });
  }
}
