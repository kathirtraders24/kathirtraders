import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { ProductListComponent } from './product-list.component';
import { productReducer } from '../store/product.reducer';
import { Product } from '../../../shared/models';

describe('ProductListComponent', () => {
  let fixture: ComponentFixture<ProductListComponent>;
  let component: ProductListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [
        provideRouter([]),
        provideStore({ products: productReducer }),
        { provide: MatDialog, useValue: { open: jasmine.createSpy('open') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    component.allProducts = [
      { id: '1', sku: 'PVC-001', name: 'PVC Pipe', category: 'plumbing', subCategory: 'Pipes', unit: 'pcs', hsnCode: '3917', gstRate: 18, unitPrice: 5000 },
      { id: '2', sku: 'ELE-002', name: 'Switch Board', category: 'electrical', subCategory: 'Accessories', unit: 'pcs', hsnCode: '8536', gstRate: 18, unitPrice: 7500 },
    ] as Product[];
    fixture.detectChanges();
  });

  it('filters products by name, sku, and category', () => {
    component.searchTerm = 'pipe';
    expect(component.filteredProducts()).toHaveSize(1);
    expect(component.filteredProducts()[0].sku).toBe('PVC-001');

    component.searchTerm = 'ele';
    expect(component.filteredProducts()).toHaveSize(1);
    expect(component.filteredProducts()[0].name).toBe('Switch Board');

    component.searchTerm = 'plumbing';
    expect(component.filteredProducts()).toHaveSize(1);
    expect(component.filteredProducts()[0].category).toBe('plumbing');
  });
});
