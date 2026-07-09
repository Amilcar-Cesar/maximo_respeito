import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { CatalogController } from './catalog.controller.js';

const catalogController = new CatalogController();

export const catalogRoutes = Router();

catalogRoutes.get('/categories', asyncHandler(catalogController.listCategories));
catalogRoutes.get('/products', asyncHandler(catalogController.listProducts));
catalogRoutes.get('/products/:id', asyncHandler(catalogController.getProductById));
