import type { Request, Response } from 'express';
import { AppError } from '../../errors/app-error.js';
import { CatalogService } from './catalog.service.js';

export class CatalogController {
  constructor(private readonly catalogService = new CatalogService()) {}

  listCategories = async (_request: Request, response: Response) => {
    const categories = await this.catalogService.listCategories();
    response.json({ data: categories });
  };

  listProducts = async (request: Request, response: Response) => {
    const products = await this.catalogService.listProducts({
      categorySlug: typeof request.query.categorySlug === 'string' ? request.query.categorySlug : undefined,
      search: typeof request.query.search === 'string' ? request.query.search : undefined
    });

    response.json({ data: products });
  };

  getProductById = async (request: Request, response: Response) => {
    const { id } = request.params;

    if (typeof id !== 'string') {
      throw new AppError('Invalid product id', 400);
    }

    const product = await this.catalogService.getProductById(id);
    response.json({ data: product });
  };
}
