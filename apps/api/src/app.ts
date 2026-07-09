import cors from 'cors';
import express from 'express';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { cartRoutes } from './modules/cart/cart.routes.js';
import { catalogRoutes } from './modules/catalog/catalog.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { errorHandler } from './middlewares/error-handler.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true
    })
  );
  app.use(express.json());

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api', catalogRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/admin', adminRoutes);
  app.use(errorHandler);

  return app;
}
