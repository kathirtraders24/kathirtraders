import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Estimation } from '../../../shared/models';

export const EstimationActions = createActionGroup({
  source: 'Estimation',
  events: {
    'Load Estimations': emptyProps(),
    'Load Estimations Success': props<{ estimations: Estimation[] }>(),
    'Load Estimations Failure': props<{ error: string }>(),
    'Create Estimation': props<{ estimation: Omit<Estimation, 'id' | 'estimationNumber'> }>(),
    'Create Estimation Success': props<{ estimation: Estimation }>(),
    'Create Estimation Failure': props<{ error: string }>(),
    'Update Estimation': props<{ id: string; changes: Partial<Estimation> }>(),
    'Update Estimation Success': props<{ estimation: Estimation }>(),
    'Update Estimation Failure': props<{ error: string }>(),
    'Delete Estimation': props<{ id: string }>(),
    'Delete Estimation Success': props<{ id: string }>(),
    'Delete Estimation Failure': props<{ error: string }>(),
  },
});
