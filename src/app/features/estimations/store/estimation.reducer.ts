import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { Estimation } from '../../../shared/models';
import { EstimationActions } from './estimation.actions';

export interface EstimationState extends EntityState<Estimation> {
  loading: boolean;
  error: string | null;
}

export const estimationAdapter = createEntityAdapter<Estimation>();

const initialState: EstimationState = estimationAdapter.getInitialState({
  loading: false,
  error: null,
});

export const estimationReducer = createReducer(
  initialState,
  on(EstimationActions.loadEstimations, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(EstimationActions.loadEstimationsSuccess, (state, { estimations }) =>
    estimationAdapter.setAll(estimations, { ...state, loading: false })
  ),
  on(EstimationActions.loadEstimationsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(EstimationActions.createEstimationSuccess, (state, { estimation }) =>
    estimationAdapter.addOne(estimation, state)
  ),
  on(EstimationActions.updateEstimationSuccess, (state, { estimation }) =>
    estimationAdapter.upsertOne(estimation, state)
  ),
  on(EstimationActions.deleteEstimationSuccess, (state, { id }) =>
    estimationAdapter.removeOne(id, state)
  )
);
