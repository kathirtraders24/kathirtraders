import { Component, ChangeDetectionStrategy, inject, signal, viewChild, ElementRef } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { debounceTime, distinctUntilChanged, switchMap, of, forkJoin, catchError } from 'rxjs';
import { ProductService } from '../../../features/inventory/services/product.service';
import { CustomerService } from '../../../features/customers/services/customer.service';
import { InvoiceService } from '../../../features/sales/services/invoice.service';

interface SearchResult {
  group: string;
  label: string;
  sublabel: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './global-search.component.html',
  styleUrl: './global-search.component.scss',
})
export class GlobalSearchComponent {
  private router = inject(Router);
  private productService = inject(ProductService);
  private customerService = inject(CustomerService);
  private invoiceService = inject(InvoiceService);

  readonly input = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  control = new FormControl('', { nonNullable: true });
  results = signal<SearchResult[]>([]);
  loading = signal(false);

  constructor() {
    this.control.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((term) => {
          const q = term.trim();
          if (q.length < 2) {
            this.results.set([]);
            return of(null);
          }
          this.loading.set(true);
          return forkJoin({
            products: this.productService.search(q).pipe(catchError(() => of([]))),
            customers: this.customerService.getAll().pipe(catchError(() => of([]))),
            invoices: this.invoiceService.getAll().pipe(catchError(() => of([]))),
          });
        }),
      )
      .subscribe((data) => {
        if (!data) return;
        const q = this.control.value.trim().toLowerCase();
        const out: SearchResult[] = [];

        for (const p of data.products.slice(0, 5)) {
          out.push({ group: 'Products', label: p.name, sublabel: p.sku, route: `/inventory/${p.id}/edit`, icon: 'inventory_2' });
        }
        for (const c of data.customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)).slice(0, 5)) {
          out.push({ group: 'Customers', label: c.name, sublabel: c.phone, route: '/customers', icon: 'people' });
        }
        for (const inv of data.invoices.filter((i) => (i.invoiceNumber ?? '').toLowerCase().includes(q) || (i.customerName ?? '').toLowerCase().includes(q)).slice(0, 5)) {
          out.push({ group: 'Invoices', label: inv.invoiceNumber, sublabel: inv.customerName, route: '/sales', icon: 'point_of_sale' });
        }

        this.results.set(out);
        this.loading.set(false);
      });
  }

  focus(): void {
    this.input()?.nativeElement.focus();
  }

  go(result: SearchResult): void {
    this.control.setValue('');
    this.results.set([]);
    this.router.navigateByUrl(result.route);
  }

  displayFn = (): string => '';
}
