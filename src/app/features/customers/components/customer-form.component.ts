import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CustomerActions } from '../store/customer.actions';
import { selectCustomerEntities } from '../store/customer.selectors';
import { NotificationService } from '../../../core';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.scss',
})
export class CustomerFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notification = inject(NotificationService);

  isEditMode = false;
  private customerId: string | null = null;

  form = this.fb.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    gstin: [''],
    stateCode: ['33', Validators.required],
    email: [''],
    address: ['', Validators.required],
    creditLimitRupees: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.customerId = this.route.snapshot.paramMap.get('id');
    if (this.customerId) {
      this.isEditMode = true;
      this.store.select(selectCustomerEntities).subscribe((entities) => {
        const c = entities[this.customerId!];
        if (c) {
          this.form.patchValue({
            name: c.name,
            phone: c.phone,
            gstin: c.gstin ?? '',
            stateCode: c.stateCode,
            email: c.email ?? '',
            address: c.address,
            creditLimitRupees: c.creditLimit / 100,
          });
        }
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const customer = {
      name: raw.name!,
      phone: raw.phone!,
      gstin: raw.gstin || undefined,
      stateCode: raw.stateCode!,
      email: raw.email || undefined,
      address: raw.address!,
      creditLimit: Math.round((raw.creditLimitRupees ?? 0) * 100),
      outstandingBalance: 0,
    };

    if (this.isEditMode && this.customerId) {
      this.store.dispatch(CustomerActions.updateCustomer({ id: this.customerId, changes: customer }));
      this.notification.success('Customer updated');
    } else {
      this.store.dispatch(CustomerActions.addCustomer({ customer }));
      this.notification.success('Customer added');
    }
    this.router.navigate(['/customers']);
  }

  cancel(): void {
    this.router.navigate(['/customers']);
  }
}
