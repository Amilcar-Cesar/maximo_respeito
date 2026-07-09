import { Router } from 'express';
import { requireAdminAuth } from '../../middlewares/admin-auth.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { AdminController } from './admin.controller.js';

const adminController = new AdminController();

export const adminRoutes = Router();

adminRoutes.use(requireAdminAuth);

adminRoutes.get('/categories', asyncHandler(adminController.listCategories));
adminRoutes.post('/categories', asyncHandler(adminController.createCategory));
adminRoutes.patch('/categories/:id', asyncHandler(adminController.updateCategory));
adminRoutes.delete('/categories/:id', asyncHandler(adminController.deleteCategory));

adminRoutes.get('/products', asyncHandler(adminController.listProducts));
adminRoutes.post('/products', asyncHandler(adminController.createProduct));
adminRoutes.patch('/products/:id', asyncHandler(adminController.updateProduct));
adminRoutes.delete('/products/:id', asyncHandler(adminController.deleteProduct));
