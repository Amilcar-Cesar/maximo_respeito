import { http } from '../lib/http';
import type { CategoryDTO, ProductListItemDTO } from '../types/catalog';

export interface CatalogResponse<T> {
  data: T;
}

export async function fetchCategories() {
  const response = await http.get<CatalogResponse<CategoryDTO[]>>('/api/categories');
  return response.data.data;
}

export async function fetchProducts() {
  const response = await http.get<CatalogResponse<ProductListItemDTO[]>>('/api/products');
  return response.data.data;
}

export async function fetchProductById(id: string) {
  const response = await http.get<CatalogResponse<ProductListItemDTO>>(`/api/products/${id}`);
  return response.data.data;
}
