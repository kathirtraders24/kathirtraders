import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Customer } from '../../../shared/models';

export const CustomerActions = createActionGroup({
  source: 'Customer',
  events: {
    'Load Customers': emptyProps(),
    'Load Customers Success': props<{ customers: Customer[] }>(),
    'Load Customers Failure': props<{ error: string }>(),
    'Add Customer': props<{ customer: Omit<Customer, 'id'> }>(),
    'Add Customer Success': props<{ customer: Customer }>(),
    'Add Customer Failure': props<{ error: string }>(),
    'Update Customer': props<{ id: string; changes: Partial<Customer> }>(),
    'Update Customer Success': props<{ customer: Customer }>(),
    'Update Customer Failure': props<{ error: string }>(),
    'Delete Customer': props<{ id: string }>(),
    'Delete Customer Success': props<{ id: string }>(),
    'Delete Customer Failure': props<{ error: string }>(),
  },
});
