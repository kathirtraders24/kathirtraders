import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { Customer } from '../../../shared/models';
import { CustomerActions } from './customer.actions';

export interface CustomerState extends EntityState<Customer> {
  loading: boolean;
  error: string | null;
}

export const customerAdapter = createEntityAdapter<Customer>();

const initialState: CustomerState = customerAdapter.getInitialState({
  loading: false,
  error: null,
});

export const customerReducer = createReducer(
  initialState,
  on(CustomerActions.loadCustomers, (state) => ({ ...state, loading: true, error: null })),
  on(CustomerActions.loadCustomersSuccess, (state, { customers }) =>
    customerAdapter.setAll(customers, { ...state, loading: false })
  ),
  on(CustomerActions.loadCustomersFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(CustomerActions.addCustomerSuccess, (state, { customer }) =>
    customerAdapter.addOne(customer, state)
  ),
  on(CustomerActions.updateCustomerSuccess, (state, { customer }) =>
    customerAdapter.upsertOne(customer, state)
  ),
  on(CustomerActions.deleteCustomerSuccess, (state, { id }) =>
    customerAdapter.removeOne(id, state)
  )
);
