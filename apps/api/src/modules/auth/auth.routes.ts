import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { AuthController } from './auth.controller.js';

const authController = new AuthController();

export const authRoutes = Router();

authRoutes.post('/login', asyncHandler(authController.login));
