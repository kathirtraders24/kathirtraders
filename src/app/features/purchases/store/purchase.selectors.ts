import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PurchaseState, purchaseAdapter } from './purchase.reducer';

export const selectPurchaseState = createFeatureSelector<PurchaseState>('purchases');
const { selectAll, selectEntities } = purchaseAdapter.getSelectors();

export const selectAllPurchases = createSelector(selectPurchaseState, selectAll);
export const selectPurchaseEntities = createSelector(selectPurchaseState, selectEntities);
export const selectPurchasesLoading = createSelector(selectPurchaseState, (s) => s.loading);
