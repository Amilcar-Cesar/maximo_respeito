import { AppError } from '../../errors/app-error.js';
import { CatalogRepository } from './catalog.repository.js';
import type { CatalogFilters } from './catalog.types.js';

export class CatalogService {
  constructor(private readonly catalogRepository = new CatalogRepository()) {}

  listCategories() {
    return this.catalogRepository.listCategories();
  }

  listProducts(filters: CatalogFilters) {
    return this.catalogRepository.listProducts(filters);
  }

  async getProductById(productId: string) {
    const product = await this.catalogRepository.getProductById(productId);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product;
  }
}
