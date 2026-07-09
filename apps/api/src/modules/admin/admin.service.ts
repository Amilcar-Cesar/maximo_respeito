import { AppError } from '../../errors/app-error.js';
import { AdminRepository } from './admin.repository.js';
import type { AdminProductImageInput, AdminProductVariantInput } from './admin.types.js';

export class AdminService {
  constructor(private readonly adminRepository = new AdminRepository()) {}

  listCategories() {
    return this.adminRepository.listCategories();
  }

  createCategory(name: string, slug: string) {
    return this.adminRepository.createCategory(name, slug);
  }

  updateCategory(id: string, name: string, slug: string) {
    return this.adminRepository.updateCategory(id, name, slug);
  }

  deleteCategory(id: string) {
    return this.adminRepository.deleteCategory(id);
  }

  listProducts() {
    return this.adminRepository.listProducts();
  }

  createProduct(input: {
    name: string;
    description?: string | null;
    basePrice: string;
    categoryId?: string | null;
    isActive: boolean;
    variants: AdminProductVariantInput[];
    images: AdminProductImageInput[];
  }) {
    if (!input.name.trim()) {
      throw new AppError('Product name is required', 400);
    }

    return this.adminRepository.createProduct(input);
  }

  updateProduct(
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
  ) {
    return this.adminRepository.updateProduct(id, input);
  }

  deleteProduct(id: string) {
    return this.adminRepository.deleteProduct(id);
  }
}
