export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface ProductImageDTO {
  id: string;
  imageUrl: string;
  position: number;
  variantId: string | null;
}

export interface ProductVariantDTO {
  id: string;
  size: string;
  color: string;
  sku: string | null;
  priceOverride: string | null;
  stock: number;
  isActive: boolean;
}

export interface ProductListItemDTO {
  id: string;
  name: string;
  description: string | null;
  basePrice: string;
  category: CategoryDTO | null;
  isActive: boolean;
  images: ProductImageDTO[];
  variants: ProductVariantDTO[];
}

export interface CatalogFilters {
  categorySlug?: string;
  search?: string;
}
