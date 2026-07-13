import type { Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../errors/app-error.js';
import { AdminService } from './admin.service.js';

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2)
});

const productVariantSchema = z.object({
  id: z.string().uuid().optional(),
  size: z.string().min(1),
  color: z.string().min(1),
  sku: z.string().optional().nullable(),
  priceOverride: z.string().optional().nullable(),
  stock: z.number().int().nonnegative(),
  isActive: z.boolean().optional()
});

const productImageSchema = z.object({
  imageUrl: z.string().url(),
  position: z.number().int().nonnegative(),
  variantId: z
    .union([z.string().uuid(), z.literal(''), z.null()])
    .optional()
    .transform((value) => (value ? value : null))
});

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  basePrice: z.string().min(1),
  categoryId: z
    .union([z.string().uuid(), z.literal(''), z.null()])
    .optional()
    .transform((value) => (value ? value : null)),
  isActive: z.boolean().default(true),
  variants: z.array(productVariantSchema).default([]),
  images: z.array(productImageSchema).default([])
});

function getIdParam(request: Request, paramName: string) {
  const value = request.params[paramName];

  if (typeof value !== 'string' || !value) {
    throw new AppError(`Invalid ${paramName}`, 400);
  }

  return value;
}

export class AdminController {
  constructor(private readonly adminService = new AdminService()) {}

  listCategories = async (_request: Request, response: Response) => {
    const categories = await this.adminService.listCategories();
    response.json({ data: categories });
  };

  createCategory = async (request: Request, response: Response) => {
    const payload = categorySchema.parse(request.body);
    const category = await this.adminService.createCategory(payload.name, payload.slug);
    response.status(201).json({ data: category });
  };

  updateCategory = async (request: Request, response: Response) => {
    const payload = categorySchema.parse(request.body);
    const category = await this.adminService.updateCategory(getIdParam(request, 'id'), payload.name, payload.slug);
    response.json({ data: category });
  };

  deleteCategory = async (request: Request, response: Response) => {
    await this.adminService.deleteCategory(getIdParam(request, 'id'));
    response.status(204).send();
  };

  listProducts = async (_request: Request, response: Response) => {
    const products = await this.adminService.listProducts();
    response.json({ data: products });
  };

  createProduct = async (request: Request, response: Response) => {
    const payload = productSchema.parse(request.body);
    const product = await this.adminService.createProduct(payload);
    response.status(201).json({ data: product });
  };

  updateProduct = async (request: Request, response: Response) => {
    const payload = productSchema.parse(request.body);
    const product = await this.adminService.updateProduct(getIdParam(request, 'id'), payload);
    response.json({ data: product });
  };

  deleteProduct = async (request: Request, response: Response) => {
    await this.adminService.deleteProduct(getIdParam(request, 'id'));
    response.status(204).send();
  };
}
