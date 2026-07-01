import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError } from 'rxjs/operators';
import { PurchaseActions } from './purchase.actions';
import { PurchaseService } from '../services/purchase.service';

@Injectable()
export class PurchaseEffects {
  private actions$ = inject(Actions);
  private purchaseService = inject(PurchaseService);

  loadPurchases$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PurchaseActions.loadPurchases),
      exhaustMap(() =>
        this.purchaseService.getAll().pipe(
          map((purchases) => PurchaseActions.loadPurchasesSuccess({ purchases })),
          catchError((err) => of(PurchaseActions.loadPurchasesFailure({ error: err.message })))
        )
      )
    )
  );

  createPurchase$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PurchaseActions.createPurchase),
      exhaustMap(({ purchase }) =>
        this.purchaseService.create(purchase).pipe(
          map((created) => PurchaseActions.createPurchaseSuccess({ purchase: created })),
          catchError((err) => of(PurchaseActions.createPurchaseFailure({ error: err.message })))
        )
      )
    )
  );

  receivePurchase$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PurchaseActions.receivePurchase),
      exhaustMap(({ id }) =>
        this.purchaseService.markReceived(id).pipe(
          map((purchase) => PurchaseActions.receivePurchaseSuccess({ purchase })),
          catchError((err) => of(PurchaseActions.receivePurchaseFailure({ error: err.message })))
        )
      )
    )
  );
}
