import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { AsyncPipe } from '@angular/common';
import { SupplierActions } from '../store/supplier.actions';
import { selectAllSuppliers, selectSuppliersLoading } from '../store/supplier.selectors';
import { Supplier, ConfirmDialogComponent } from '../../../shared';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatProgressBarModule, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './supplier-list.component.html',
  styleUrl: './supplier-list.component.scss',
})
export class SupplierListComponent implements OnInit {
  private store = inject(Store);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  suppliers$ = this.store.select(selectAllSuppliers);
  loading$ = this.store.select(selectSuppliersLoading);
  displayedColumns = ['name', 'gstin', 'phone', 'paymentTerms', 'actions'];

  ngOnInit(): void {
    this.store.dispatch(SupplierActions.loadSuppliers());
  }

  addSupplier(): void {
    this.router.navigate(['/suppliers', 'new']);
  }

  editSupplier(s: Supplier): void {
    this.router.navigate(['/suppliers', s.id, 'edit']);
  }

  deleteSupplier(s: Supplier): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Supplier', message: `Delete "${s.name}"?`, confirmText: 'Delete' },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.store.dispatch(SupplierActions.deleteSupplier({ id: s.id }));
    });
  }
}
