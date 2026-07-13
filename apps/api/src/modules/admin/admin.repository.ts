import { randomUUID } from 'crypto';
import { supabase } from '../../config/supabase.js';
import type {
  AdminCategoryDTO,
  AdminProductDTO,
  AdminProductImageInput,
  AdminProductVariantInput
} from './admin.types.js';
import type { CategoryRow, ProductImageRow, ProductVariantRow, ProductWithCategoryName } from '../../types/database.js';
import { assertNoError, throwOnError, toPriceString } from '../../utils/supabase-error.js';
import { asSingle } from '../../utils/supabase-relations.js';

const productAdminSelect = `
  id,
  name,
  description,
  base_price,
  category_id,
  is_active,
  created_at,
  updated_at,
  categories (name),
  product_variants (id, size, color, sku, price_override, stock, is_active),
  product_images (image_url, position, variant_id)
`;

function mapCategory(category: CategoryRow): AdminCategoryDTO {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    createdAt: category.created_at
  };
}

function mapProduct(product: ProductWithCategoryName): AdminProductDTO {
  const variants = [...product.product_variants].sort(
    (left, right) => left.size.localeCompare(right.size) || left.color.localeCompare(right.color)
  );
  const images = [...product.product_images].sort((left, right) => left.position - right.position);

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    basePrice: toPriceString(product.base_price) ?? '0.00',
    categoryId: product.category_id,
    categoryName: asSingle(product.categories)?.name ?? null,
    isActive: product.is_active,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
    variants: variants.map((variant: ProductVariantRow) => ({
      id: variant.id,
      size: variant.size,
      color: variant.color,
      sku: variant.sku,
      priceOverride: toPriceString(variant.price_override),
      stock: variant.stock,
      isActive: variant.is_active
    })),
    images: images.map((image: ProductImageRow) => ({
      imageUrl: image.image_url,
      position: image.position,
      variantId: image.variant_id
    }))
  };
}

async function fetchProductById(id: string): Promise<AdminProductDTO> {
  const result = await supabase.from('products').select(productAdminSelect).eq('id', id).single();
  const product = assertNoError(result, 'Failed to fetch product');
  return mapProduct(product as unknown as ProductWithCategoryName);
}

export class AdminRepository {
  async listCategories(): Promise<AdminCategoryDTO[]> {
    const result = await supabase
      .from('categories')
      .select('id, name, slug, created_at')
      .order('created_at', { ascending: false });

    const categories = assertNoError(result, 'Failed to list categories');
    return categories.map(mapCategory);
  }

  async createCategory(name: string, slug: string): Promise<AdminCategoryDTO> {
    const result = await supabase.from('categories').insert({ name, slug }).select('id, name, slug, created_at').single();

    return mapCategory(assertNoError(result, 'Failed to create category'));
  }

  async updateCategory(id: string, name: string, slug: string): Promise<AdminCategoryDTO> {
    const result = await supabase
      .from('categories')
      .update({ name, slug })
      .eq('id', id)
      .select('id, name, slug, created_at')
      .single();

    return mapCategory(assertNoError(result, 'Failed to update category'));
  }

  async deleteCategory(id: string): Promise<void> {
    const result = await supabase.from('categories').delete().eq('id', id);
    throwOnError(result.error, 'Failed to delete category');
  }

  async listProducts(): Promise<AdminProductDTO[]> {
    const result = await supabase.from('products').select(productAdminSelect).order('created_at', { ascending: false });

    const products = assertNoError(result, 'Failed to list products') as unknown as ProductWithCategoryName[];
    return products.map(mapProduct);
  }

  async createProduct(input: {
    name: string;
    description?: string | null;
    basePrice: string;
    categoryId?: string | null;
    isActive: boolean;
    variants: AdminProductVariantInput[];
    images: AdminProductImageInput[];
  }): Promise<AdminProductDTO> {
    const productResult = await supabase
      .from('products')
      .insert({
        name: input.name,
        description: input.description ?? null,
        base_price: input.basePrice,
        category_id: input.categoryId ?? null,
        is_active: input.isActive
      })
      .select('id')
      .single();

    const product = assertNoError(productResult, 'Failed to create product');

    if (input.variants.length > 0) {
      const variantsResult = await supabase.from('product_variants').insert(
        input.variants.map((variant) => ({
          product_id: product.id,
          size: variant.size,
          color: variant.color,
          sku: variant.sku ?? null,
          price_override: variant.priceOverride ?? null,
          stock: variant.stock,
          is_active: variant.isActive ?? true
        }))
      );

      throwOnError(variantsResult.error, 'Failed to create product variants');
    }

    if (input.images.length > 0) {
      const imagesResult = await supabase.from('product_images').insert(
        input.images.map((image) => ({
          product_id: product.id,
          image_url: image.imageUrl,
          position: image.position,
          variant_id: image.variantId ?? null
        }))
      );

      throwOnError(imagesResult.error, 'Failed to create product images');
    }

    return fetchProductById(product.id);
  }

  async updateProduct(
    id: string,
    input: {
      name: string;
      description?: string | null;
      basePrice: string;
      categoryId?: string | null;
      isActive: boolean;
      variants: AdminProductVariantInput[];
      images: AdminProductImageInput[];
    }
  ): Promise<AdminProductDTO> {
    // 1. Fetch existing variants for this product to map size/color to variant ID
    const { data: existingVariants, error: fetchErr } = await supabase
      .from('product_variants')
      .select('id, size, color')
      .eq('product_id', id);

    if (fetchErr) {
      throwOnError(fetchErr, 'Failed to fetch existing product variants');
    }

    const dbVariants = existingVariants || [];
    const getKey = (size: string, color: string) => `${size.trim().toLowerCase()}_${color.trim().toLowerCase()}`;
    const dbVariantMap = new Map(dbVariants.map((v) => [getKey(v.size, v.color), v]));

    // Determine which ones to remove (exists in DB, but not in input)
    const inputKeys = new Set(input.variants.map((v) => getKey(v.size, v.color)));
    const variantsToRemove = dbVariants.filter((v) => !inputKeys.has(getKey(v.size, v.color)));

    // 2. Delete or soft-delete removed variants
    for (const variant of variantsToRemove) {
      const { error: deleteErr } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variant.id);

      if (deleteErr) {
        // If delete fails (due to referential integrity), soft delete instead
        const { error: updateErr } = await supabase
          .from('product_variants')
          .update({ is_active: false })
          .eq('id', variant.id);
        
        throwOnError(updateErr, 'Failed to soft delete variant');
      }
    }

    // 3. Upsert incoming variants
    if (input.variants.length > 0) {
      const upsertPayload = input.variants.map((variant) => {
        const key = getKey(variant.size, variant.color);
        const existing = dbVariantMap.get(key);
        const row = {
          id: variant.id || existing?.id || randomUUID(),
          product_id: id,
          size: variant.size,
          color: variant.color,
          sku: variant.sku ?? null,
          price_override: variant.priceOverride ?? null,
          stock: variant.stock,
          is_active: variant.isActive ?? true
        };

        return row;
      });

      const variantsResult = await supabase
        .from('product_variants')
        .upsert(upsertPayload, { onConflict: 'product_id, size, color' });

      throwOnError(variantsResult.error, 'Failed to update product variants');
    }

    // 4. Update product images (recreation is fine since they aren't referenced by restrict tables)
    const deleteImages = await supabase.from('product_images').delete().eq('product_id', id);
    throwOnError(deleteImages.error, 'Failed to delete product images');

    const updateResult = await supabase
      .from('products')
      .update({
        name: input.name,
        description: input.description ?? null,
        base_price: input.basePrice,
        category_id: input.categoryId ?? null,
        is_active: input.isActive
      })
      .eq('id', id)
      .select('id')
      .single();

    assertNoError(updateResult, 'Failed to update product');

    if (input.images.length > 0) {
      const imagesResult = await supabase.from('product_images').insert(
        input.images.map((image) => ({
          product_id: id,
          image_url: image.imageUrl,
          position: image.position,
          variant_id: image.variantId ?? null
        }))
      );

      throwOnError(imagesResult.error, 'Failed to update product images');
    }

    return fetchProductById(id);
  }

  async deleteProduct(id: string): Promise<void> {
    const result = await supabase.from('products').update({ is_active: false }).eq('id', id);
    throwOnError(result.error, 'Failed to delete product');
  }
}
