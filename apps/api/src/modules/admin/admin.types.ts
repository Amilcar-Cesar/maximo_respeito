export interface AdminCategoryDTO {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface AdminProductVariantInput {
  id?: string;
  size: string;
  color: string;
  sku?: string | null;
  priceOverride?: string | null;
  stock: number;
  isActive?: boolean;
}

export interface AdminProductImageInput {
  imageUrl: string;
  position: number;
  variantId?: string | null;
}

export interface AdminProductDTO {
  id: string;
  name: string;
  description: string | null;
  basePrice: string;
  categoryId: string | null;
  categoryName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  variants: AdminProductVariantInput[];
  images: AdminProductImageInput[];
}
