import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SupplierState, supplierAdapter } from './supplier.reducer';

export const selectSupplierState = createFeatureSelector<SupplierState>('suppliers');
const { selectAll, selectEntities, selectTotal } = supplierAdapter.getSelectors();

export const selectAllSuppliers = createSelector(selectSupplierState, selectAll);
export const selectSupplierEntities = createSelector(selectSupplierState, selectEntities);
export const selectSupplierCount = createSelector(selectSupplierState, selectTotal);
export const selectSuppliersLoading = createSelector(selectSupplierState, (s) => s.loading);
