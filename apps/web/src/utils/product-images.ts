import type { ProductImageDTO } from '../types/catalog';

function sortImages(images: ProductImageDTO[]): ProductImageDTO[] {
  return [...images].sort((left, right) => left.position - right.position);
}

export function getPrimaryImageUrl(
  images: ProductImageDTO[],
  variantId?: string | null
): string | null {
  const sorted = sortImages(images);

  if (variantId) {
    const variantImage = sorted.find((image) => image.variantId === variantId);
    if (variantImage) {
      return variantImage.imageUrl;
    }
  }

  const productImage = sorted.find((image) => !image.variantId);
  return productImage?.imageUrl ?? sorted[0]?.imageUrl ?? null;
}

export function getDisplayImages(
  images: ProductImageDTO[],
  variantId?: string | null
): ProductImageDTO[] {
  const sorted = sortImages(images);

  if (variantId) {
    const variantImages = sorted.filter((image) => image.variantId === variantId);
    if (variantImages.length > 0) {
      return variantImages;
    }
  }

  const productImages = sorted.filter((image) => !image.variantId);
  return productImages.length > 0 ? productImages : sorted;
}
