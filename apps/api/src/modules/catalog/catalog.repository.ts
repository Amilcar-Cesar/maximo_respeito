import { supabase } from '../../config/supabase.js';
import type { CategoryRow, ProductImageRow, ProductVariantRow, ProductWithRelations } from '../../types/database.js';
import { assertNoError, toPriceString } from '../../utils/supabase-error.js';
import { asSingle } from '../../utils/supabase-relations.js';
import type { CatalogFilters, CategoryDTO, ProductListItemDTO } from './catalog.types.js';

function mapCategory(category: CategoryRow): CategoryDTO {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    createdAt: category.created_at
  };
}

function mapProduct(product: ProductWithRelations): ProductListItemDTO {
  const activeVariants = product.product_variants
    .filter((variant) => variant.is_active)
    .sort((left, right) => left.size.localeCompare(right.size) || left.color.localeCompare(right.color));

  const images = [...product.product_images].sort((left, right) => left.position - right.position);

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    basePrice: toPriceString(product.base_price) ?? '0.00',
    category: asSingle(product.categories) ? mapCategory(asSingle(product.categories)!) : null,
    isActive: product.is_active,
    images: images.map((image: ProductImageRow) => ({
      id: image.id,
      imageUrl: image.image_url,
      position: image.position,
      variantId: image.variant_id
    })),
    variants: activeVariants.map((variant: ProductVariantRow) => ({
      id: variant.id,
      size: variant.size,
      color: variant.color,
      sku: variant.sku,
      priceOverride: toPriceString(variant.price_override),
      stock: variant.stock,
      isActive: variant.is_active
    }))
  };
}

const productSelect = `
  id,
  name,
  description,
  base_price,
  is_active,
  created_at,
  categories (id, name, slug, created_at),
  product_images (id, image_url, position, variant_id),
  product_variants (id, size, color, sku, price_override, stock, is_active)
`;

export class CatalogRepository {
  async listCategories(): Promise<CategoryDTO[]> {
    const result = await supabase.from('categories').select('id, name, slug, created_at').order('name', { ascending: true });

    const categories = assertNoError(result, 'Failed to list categories');
    return categories.map(mapCategory);
  }

  async listProducts(filters: CatalogFilters = {}): Promise<ProductListItemDTO[]> {
    let query = supabase
      .from('products')
      .select(
        filters.categorySlug
          ? `${productSelect.replace('categories (', 'categories!inner (')}`
          : productSelect
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (filters.categorySlug) {
      query = query.eq('categories.slug', filters.categorySlug);
    }

    if (filters.search) {
      const term = filters.search.replace(/[%_]/g, '\\$&');
      query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
    }

    const result = await query;
    const products = assertNoError(result, 'Failed to list products') as unknown as ProductWithRelations[];

    return products.map(mapProduct);
  }

  async getProductById(productId: string): Promise<ProductListItemDTO | null> {
    const result = await supabase
      .from('products')
      .select(productSelect)
      .eq('id', productId)
      .maybeSingle();

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (!result.data || !result.data.is_active) {
      return null;
    }

    return mapProduct(result.data as unknown as ProductWithRelations);
  }
}
