import { Component, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ProductActions } from '../store/product.actions';
import { selectProductById } from '../store/product.selectors';
import { NotificationService } from '../../../core';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatCardModule, MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notification = inject(NotificationService);

  isEditMode = false;
  private productId: string | null = null;

  form = this.fb.group({
    sku: ['', Validators.required],
    name: ['', Validators.required],
    category: ['', Validators.required],
    subCategory: ['', Validators.required],
    unit: ['', Validators.required],
    hsnCode: ['', Validators.required],
    gstRate: [18, Validators.required],
    unitPriceRupees: [0, [Validators.required, Validators.min(0)]],
    description: [''],
  });

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode = true;
      this.store.select(selectProductById(this.productId)).subscribe((product) => {
        if (product) {
          this.form.patchValue({
            ...product,
            unitPriceRupees: product.unitPrice / 100,
          });
        }
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const product = {
      sku: raw.sku!,
      name: raw.name!,
      category: raw.category as 'plumbing' | 'electrical',
      subCategory: raw.subCategory!,
      unit: raw.unit!,
      hsnCode: raw.hsnCode!,
      gstRate: raw.gstRate!,
      unitPrice: Math.round((raw.unitPriceRupees ?? 0) * 100),
      description: raw.description ?? undefined,
    };

    if (this.isEditMode && this.productId) {
      this.store.dispatch(ProductActions.updateProduct({ id: this.productId, changes: product }));
      this.notification.success('Product updated successfully');
    } else {
      this.store.dispatch(ProductActions.addProduct({ product }));
      this.notification.success('Product added successfully');
    }

    this.router.navigate(['/inventory']);
  }

  cancel(): void {
    this.router.navigate(['/inventory']);
  }
}
