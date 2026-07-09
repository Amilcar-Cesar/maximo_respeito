import { useQuery } from '@tanstack/react-query';
import { fetchCategories, fetchProductById, fetchProducts } from '../services/catalog.service';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => fetchProductById(id),
    enabled: Boolean(id)
  });
}
