import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError } from 'rxjs/operators';
import { EstimationActions } from './estimation.actions';
import { EstimationService } from '../services/estimation.service';

@Injectable()
export class EstimationEffects {
  private actions$ = inject(Actions);
  private estimationService = inject(EstimationService);

  loadEstimations$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EstimationActions.loadEstimations),
      exhaustMap(() =>
        this.estimationService.getAll().pipe(
          map((estimations) => EstimationActions.loadEstimationsSuccess({ estimations })),
          catchError((err) =>
            of(EstimationActions.loadEstimationsFailure({ error: err.message }))
          )
        )
      )
    )
  );

  createEstimation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EstimationActions.createEstimation),
      exhaustMap(({ estimation }) =>
        this.estimationService.create(estimation).pipe(
          map((created) => EstimationActions.createEstimationSuccess({ estimation: created })),
          catchError((err) =>
            of(EstimationActions.createEstimationFailure({ error: err.message }))
          )
        )
      )
    )
  );

  updateEstimation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EstimationActions.updateEstimation),
      exhaustMap(({ id, changes }) =>
        this.estimationService.update(id, changes).pipe(
          map((estimation) => EstimationActions.updateEstimationSuccess({ estimation })),
          catchError((err) =>
            of(EstimationActions.updateEstimationFailure({ error: err.message }))
          )
        )
      )
    )
  );

  deleteEstimation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EstimationActions.deleteEstimation),
      exhaustMap(({ id }) =>
        this.estimationService.delete(id).pipe(
          map(() => EstimationActions.deleteEstimationSuccess({ id })),
          catchError((err) =>
            of(EstimationActions.deleteEstimationFailure({ error: err.message }))
          )
        )
      )
    )
  );
}
