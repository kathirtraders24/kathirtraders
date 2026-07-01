import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { PurchaseOrder } from '../../../shared/models';

export const PurchaseActions = createActionGroup({
  source: 'Purchase',
  events: {
    'Load Purchases': emptyProps(),
    'Load Purchases Success': props<{ purchases: PurchaseOrder[] }>(),
    'Load Purchases Failure': props<{ error: string }>(),
    'Create Purchase': props<{ purchase: Omit<PurchaseOrder, 'id' | 'poNumber'> }>(),
    'Create Purchase Success': props<{ purchase: PurchaseOrder }>(),
    'Create Purchase Failure': props<{ error: string }>(),
    'Receive Purchase': props<{ id: string }>(),
    'Receive Purchase Success': props<{ purchase: PurchaseOrder }>(),
    'Receive Purchase Failure': props<{ error: string }>(),
  },
});
