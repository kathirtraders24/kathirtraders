import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProductState, productAdapter } from './product.reducer';

export const selectProductState = createFeatureSelector<ProductState>('products');

const { selectAll, selectEntities, selectTotal } = productAdapter.getSelectors();

export const selectAllProducts = createSelector(selectProductState, selectAll);
export const selectProductEntities = createSelector(selectProductState, selectEntities);
export const selectProductCount = createSelector(selectProductState, selectTotal);
export const selectProductsLoading = createSelector(selectProductState, (s) => s.loading);
export const selectProductsError = createSelector(selectProductState, (s) => s.error);

export const selectProductById = (id: string) =>
  createSelector(selectProductEntities, (entities) => entities[id]);

export const selectProductsByCategory = (category: string) =>
  createSelector(selectAllProducts, (products) =>
    products.filter((p) => p.category === category)
  );
