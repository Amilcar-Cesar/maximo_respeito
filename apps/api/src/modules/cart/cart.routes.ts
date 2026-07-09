import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { CartController } from './cart.controller.js';

const cartController = new CartController();

export const cartRoutes = Router();

cartRoutes.get('/', asyncHandler(cartController.getCart));
cartRoutes.post('/items', asyncHandler(cartController.addItem));
cartRoutes.patch('/items/:itemId', asyncHandler(cartController.updateItem));
cartRoutes.delete('/items/:itemId', asyncHandler(cartController.removeItem));
cartRoutes.post('/checkout', asyncHandler(cartController.checkout));
