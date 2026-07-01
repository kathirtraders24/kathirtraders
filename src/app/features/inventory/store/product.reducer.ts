import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { Product } from '../../../shared/models';
import { ProductActions } from './product.actions';

export interface ProductState extends EntityState<Product> {
  loading: boolean;
  error: string | null;
}

export const productAdapter = createEntityAdapter<Product>();

const initialState: ProductState = productAdapter.getInitialState({
  loading: false,
  error: null,
});

export const productReducer = createReducer(
  initialState,
  on(ProductActions.loadProducts, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ProductActions.loadProductsSuccess, (state, { products }) =>
    productAdapter.setAll(products, { ...state, loading: false })
  ),
  on(ProductActions.loadProductsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(ProductActions.addProductSuccess, (state, { product }) =>
    productAdapter.addOne(product, state)
  ),
  on(ProductActions.updateProductSuccess, (state, { product }) =>
    productAdapter.upsertOne(product, state)
  ),
  on(ProductActions.deleteProductSuccess, (state, { id }) =>
    productAdapter.removeOne(id, state)
  )
);
