import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductActions } from '../store/product.actions';
import { selectAllProducts, selectProductsLoading } from '../store/product.selectors';
import { PaisePipe, Product, ConfirmDialogComponent } from '../../../shared';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatChipsModule, MatProgressBarModule,
    AsyncPipe, FormsModule, PaisePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent implements OnInit {
  private store = inject(Store);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  products$ = this.store.select(selectAllProducts);
  loading$ = this.store.select(selectProductsLoading);
  searchTerm = '';
  displayedColumns = ['sku', 'name', 'category', 'hsnCode', 'gstRate', 'unitPrice', 'actions'];

  ngOnInit(): void {
    this.store.dispatch(ProductActions.loadProducts());
  }

  addProduct(): void {
    this.router.navigate(['/inventory', 'new']);
  }

  editProduct(product: Product): void {
    this.router.navigate(['/inventory', product.id, 'edit']);
  }

  deleteProduct(product: Product): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Product',
        message: `Are you sure you want to delete "${product.name}"?`,
        confirmText: 'Delete',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.store.dispatch(ProductActions.deleteProduct({ id: product.id }));
      }
    });
  }
}
