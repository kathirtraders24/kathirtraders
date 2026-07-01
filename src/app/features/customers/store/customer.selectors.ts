import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CustomerState, customerAdapter } from './customer.reducer';

export const selectCustomerState = createFeatureSelector<CustomerState>('customers');
const { selectAll, selectEntities, selectTotal } = customerAdapter.getSelectors();

export const selectAllCustomers = createSelector(selectCustomerState, selectAll);
export const selectCustomerEntities = createSelector(selectCustomerState, selectEntities);
export const selectCustomerCount = createSelector(selectCustomerState, selectTotal);
export const selectCustomersLoading = createSelector(selectCustomerState, (s) => s.loading);
