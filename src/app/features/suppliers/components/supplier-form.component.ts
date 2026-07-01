import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { SupplierActions } from '../store/supplier.actions';
import { selectSupplierEntities } from '../store/supplier.selectors';
import { NotificationService } from '../../../core';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './supplier-form.component.html',
  styleUrl: './supplier-form.component.scss',
})
export class SupplierFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notification = inject(NotificationService);

  isEditMode = false;
  private supplierId: string | null = null;

  form = this.fb.group({
    name: ['', Validators.required],
    gstin: ['', Validators.required],
    phone: ['', Validators.required],
    email: [''],
    stateCode: ['33', Validators.required],
    address: ['', Validators.required],
    paymentTerms: ['', Validators.required],
  });

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.paramMap.get('id');
    if (this.supplierId) {
      this.isEditMode = true;
      this.store.select(selectSupplierEntities).subscribe((entities) => {
        const s = entities[this.supplierId!];
        if (s) {
          this.form.patchValue(s);
        }
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const supplier = {
      name: raw.name!,
      gstin: raw.gstin!,
      phone: raw.phone!,
      email: raw.email || undefined,
      stateCode: raw.stateCode!,
      address: raw.address!,
      paymentTerms: raw.paymentTerms!,
    };

    if (this.isEditMode && this.supplierId) {
      this.store.dispatch(SupplierActions.updateSupplier({ id: this.supplierId, changes: supplier }));
      this.notification.success('Supplier updated');
    } else {
      this.store.dispatch(SupplierActions.addSupplier({ supplier }));
      this.notification.success('Supplier added');
    }
    this.router.navigate(['/suppliers']);
  }

  cancel(): void {
    this.router.navigate(['/suppliers']);
  }
}
