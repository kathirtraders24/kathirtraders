import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError } from 'rxjs/operators';
import { SupplierActions } from './supplier.actions';
import { SupplierService } from '../services/supplier.service';

@Injectable()
export class SupplierEffects {
  private actions$ = inject(Actions);
  private supplierService = inject(SupplierService);

  loadSuppliers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SupplierActions.loadSuppliers),
      exhaustMap(() =>
        this.supplierService.getAll().pipe(
          map((suppliers) => SupplierActions.loadSuppliersSuccess({ suppliers })),
          catchError((err) => of(SupplierActions.loadSuppliersFailure({ error: err.message })))
        )
      )
    )
  );

  addSupplier$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SupplierActions.addSupplier),
      exhaustMap(({ supplier }) =>
        this.supplierService.create(supplier).pipe(
          map((created) => SupplierActions.addSupplierSuccess({ supplier: created })),
          catchError((err) => of(SupplierActions.addSupplierFailure({ error: err.message })))
        )
      )
    )
  );

  updateSupplier$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SupplierActions.updateSupplier),
      exhaustMap(({ id, changes }) =>
        this.supplierService.update(id, changes).pipe(
          map((supplier) => SupplierActions.updateSupplierSuccess({ supplier })),
          catchError((err) => of(SupplierActions.updateSupplierFailure({ error: err.message })))
        )
      )
    )
  );

  deleteSupplier$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SupplierActions.deleteSupplier),
      exhaustMap(({ id }) =>
        this.supplierService.delete(id).pipe(
          map(() => SupplierActions.deleteSupplierSuccess({ id })),
          catchError((err) => of(SupplierActions.deleteSupplierFailure({ error: err.message })))
        )
      )
    )
  );
}
