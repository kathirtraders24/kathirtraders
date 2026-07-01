import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError } from 'rxjs/operators';
import { ProductActions } from './product.actions';
import { ProductService } from '../services/product.service';

@Injectable()
export class ProductEffects {
  private actions$ = inject(Actions);
  private productService = inject(ProductService);

  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.loadProducts),
      exhaustMap(() =>
        this.productService.getAll().pipe(
          map((products) => ProductActions.loadProductsSuccess({ products })),
          catchError((err) =>
            of(ProductActions.loadProductsFailure({ error: err.message }))
          )
        )
      )
    )
  );

  addProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.addProduct),
      exhaustMap(({ product }) =>
        this.productService.create(product).pipe(
          map((created) => ProductActions.addProductSuccess({ product: created })),
          catchError((err) =>
            of(ProductActions.addProductFailure({ error: err.message }))
          )
        )
      )
    )
  );

  updateProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.updateProduct),
      exhaustMap(({ id, changes }) =>
        this.productService.update(id, changes).pipe(
          map((product) => ProductActions.updateProductSuccess({ product })),
          catchError((err) =>
            of(ProductActions.updateProductFailure({ error: err.message }))
          )
        )
      )
    )
  );

  deleteProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.deleteProduct),
      exhaustMap(({ id }) =>
        this.productService.delete(id).pipe(
          map(() => ProductActions.deleteProductSuccess({ id })),
          catchError((err) =>
            of(ProductActions.deleteProductFailure({ error: err.message }))
          )
        )
      )
    )
  );
}
