import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { Supplier } from '../../../shared/models';
import { SupplierActions } from './supplier.actions';

export interface SupplierState extends EntityState<Supplier> {
  loading: boolean;
  error: string | null;
}

export const supplierAdapter = createEntityAdapter<Supplier>();

const initialState: SupplierState = supplierAdapter.getInitialState({
  loading: false,
  error: null,
});

export const supplierReducer = createReducer(
  initialState,
  on(SupplierActions.loadSuppliers, (state) => ({ ...state, loading: true, error: null })),
  on(SupplierActions.loadSuppliersSuccess, (state, { suppliers }) =>
    supplierAdapter.setAll(suppliers, { ...state, loading: false })
  ),
  on(SupplierActions.loadSuppliersFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(SupplierActions.addSupplierSuccess, (state, { supplier }) =>
    supplierAdapter.addOne(supplier, state)
  ),
  on(SupplierActions.updateSupplierSuccess, (state, { supplier }) =>
    supplierAdapter.upsertOne(supplier, state)
  ),
  on(SupplierActions.deleteSupplierSuccess, (state, { id }) =>
    supplierAdapter.removeOne(id, state)
  )
);
