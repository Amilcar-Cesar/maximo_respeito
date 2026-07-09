import { http } from '../lib/http';
import type { CartDTO, CheckoutInputDTO, OrderDTO } from '../types/cart';

interface ApiResponse<T> {
  data: T;
}

export async function fetchCart() {
  const response = await http.get<ApiResponse<CartDTO>>('/api/cart');
  return response.data.data;
}

export async function addCartItem(variantId: string, quantity: number) {
  const response = await http.post<ApiResponse<CartDTO>>('/api/cart/items', { variantId, quantity });
  return response.data.data;
}

export async function updateCartItem(itemId: string, quantity: number) {
  const response = await http.patch<ApiResponse<CartDTO>>(`/api/cart/items/${itemId}`, { quantity });
  return response.data.data;
}

export async function removeCartItem(itemId: string) {
  const response = await http.delete<ApiResponse<CartDTO>>(`/api/cart/items/${itemId}`);
  return response.data.data;
}

export async function checkoutCart(payload: CheckoutInputDTO) {
  const response = await http.post<ApiResponse<OrderDTO>>('/api/cart/checkout', payload);
  return response.data.data;
}
