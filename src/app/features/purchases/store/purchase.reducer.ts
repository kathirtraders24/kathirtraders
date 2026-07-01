import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { PurchaseOrder } from '../../../shared/models';
import { PurchaseActions } from './purchase.actions';

export interface PurchaseState extends EntityState<PurchaseOrder> {
  loading: boolean;
  error: string | null;
}

export const purchaseAdapter = createEntityAdapter<PurchaseOrder>();

const initialState: PurchaseState = purchaseAdapter.getInitialState({
  loading: false,
  error: null,
});

export const purchaseReducer = createReducer(
  initialState,
  on(PurchaseActions.loadPurchases, (state) => ({ ...state, loading: true, error: null })),
  on(PurchaseActions.loadPurchasesSuccess, (state, { purchases }) =>
    purchaseAdapter.setAll(purchases, { ...state, loading: false })
  ),
  on(PurchaseActions.loadPurchasesFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(PurchaseActions.createPurchaseSuccess, (state, { purchase }) =>
    purchaseAdapter.addOne(purchase, state)
  ),
  on(PurchaseActions.receivePurchaseSuccess, (state, { purchase }) =>
    purchaseAdapter.upsertOne(purchase, state)
  )
);
