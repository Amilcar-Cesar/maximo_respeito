import { http } from '../lib/http';
import type { AdminCategoryDTO, AdminProductDTO, AdminProductImageInput, AdminProductVariantInput } from '../types/admin';

interface ApiResponse<T> {
  data: T;
}

export interface AdminSessionDTO {
  token: string;
  expiresAt: string;
  username: string;
}

export interface AdminProductFormPayload {
  name: string;
  description?: string | null;
  basePrice: string;
  categoryId?: string | null;
  isActive: boolean;
  variants: AdminProductVariantInput[];
  images: AdminProductImageInput[];
}

export async function loginAdmin(payload: { username: string; password: string }) {
  const response = await http.post<ApiResponse<AdminSessionDTO>>('/api/auth/login', payload);
  return response.data.data;
}

export async function fetchAdminCategories() {
  const response = await http.get<ApiResponse<AdminCategoryDTO[]>>('/api/admin/categories');
  return response.data.data;
}

export async function createAdminCategory(payload: { name: string; slug: string }) {
  const response = await http.post<ApiResponse<AdminCategoryDTO>>('/api/admin/categories', payload);
  return response.data.data;
}

export async function updateAdminCategory(id: string, payload: { name: string; slug: string }) {
  const response = await http.patch<ApiResponse<AdminCategoryDTO>>(`/api/admin/categories/${id}`, payload);
  return response.data.data;
}

export async function deleteAdminCategory(id: string) {
  await http.delete(`/api/admin/categories/${id}`);
}

export async function fetchAdminProducts() {
  const response = await http.get<ApiResponse<AdminProductDTO[]>>('/api/admin/products');
  return response.data.data;
}

export async function createAdminProduct(payload: AdminProductFormPayload) {
  const response = await http.post<ApiResponse<AdminProductDTO>>('/api/admin/products', payload);
  return response.data.data;
}

export async function updateAdminProduct(id: string, payload: AdminProductFormPayload) {
  const response = await http.patch<ApiResponse<AdminProductDTO>>(`/api/admin/products/${id}`, payload);
  return response.data.data;
}

export async function deleteAdminProduct(id: string) {
  await http.delete(`/api/admin/products/${id}`);
}
