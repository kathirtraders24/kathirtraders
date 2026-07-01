import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Supplier } from '../../../shared/models';

export const SupplierActions = createActionGroup({
  source: 'Supplier',
  events: {
    'Load Suppliers': emptyProps(),
    'Load Suppliers Success': props<{ suppliers: Supplier[] }>(),
    'Load Suppliers Failure': props<{ error: string }>(),
    'Add Supplier': props<{ supplier: Omit<Supplier, 'id'> }>(),
    'Add Supplier Success': props<{ supplier: Supplier }>(),
    'Add Supplier Failure': props<{ error: string }>(),
    'Update Supplier': props<{ id: string; changes: Partial<Supplier> }>(),
    'Update Supplier Success': props<{ supplier: Supplier }>(),
    'Update Supplier Failure': props<{ error: string }>(),
    'Delete Supplier': props<{ id: string }>(),
    'Delete Supplier Success': props<{ id: string }>(),
    'Delete Supplier Failure': props<{ error: string }>(),
  },
});
