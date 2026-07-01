import { createFeatureSelector, createSelector } from '@ngrx/store';
import { EstimationState, estimationAdapter } from './estimation.reducer';

export const selectEstimationState = createFeatureSelector<EstimationState>('estimations');

const { selectAll, selectEntities, selectTotal } = estimationAdapter.getSelectors();

export const selectAllEstimations = createSelector(selectEstimationState, selectAll);
export const selectEstimationEntities = createSelector(selectEstimationState, selectEntities);
export const selectEstimationCount = createSelector(selectEstimationState, selectTotal);
export const selectEstimationsLoading = createSelector(selectEstimationState, (s) => s.loading);

export const selectEstimationById = (id: string) =>
  createSelector(selectEstimationEntities, (entities) => entities[id]);
