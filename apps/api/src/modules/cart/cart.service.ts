import { randomUUID } from 'node:crypto';
import { AppError } from '../../errors/app-error.js';
import { asSingle } from '../../utils/supabase-relations.js';
import { CartRepository } from './cart.repository.js';
import type { CartDTO, CheckoutInputDTO, OrderDTO } from './cart.types.js';

export class CartService {
  constructor(private readonly cartRepository = new CartRepository()) {}

  async getOrCreateCart(sessionToken?: string): Promise<CartDTO> {
    if (!sessionToken) {
      const newToken = randomUUID();
      const cart = await this.cartRepository.createCart(newToken);
      return this.cartRepository.mapCart(cart);
    }

    const cart = await this.cartRepository.findCartBySessionToken(sessionToken);

    if (!cart || cart.status !== 'active') {
      const newToken = randomUUID();
      const nextCart = await this.cartRepository.createCart(newToken);
      return this.cartRepository.mapCart(nextCart);
    }

    return this.cartRepository.mapCart(cart);
  }

  async addItem(sessionToken: string | undefined, variantId: string, quantity: number): Promise<CartDTO> {
    if (!variantId) {
      throw new AppError('Variant is required', 400);
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new AppError('Quantity must be greater than zero', 400);
    }

    const resolvedCart = await this.getOrCreateCart(sessionToken);
    const variant = await this.cartRepository.findVariantById(variantId);

    if (!variant) {
      throw new AppError('Variant not found', 404);
    }

    const existingItem = resolvedCart.items.find((item) => item.variantId === variantId);
    const existingQuantity = existingItem ? existingItem.quantity : 0;

    if (variant.stock < existingQuantity + quantity) {
      throw new AppError('Insufficient stock', 400);
    }

    const unitPrice = this.cartRepository.resolveVariantPrice(variant);

    await this.cartRepository.upsertCartItem(resolvedCart.id, variantId, unitPrice, quantity);
    const refreshed = await this.cartRepository.findCartBySessionToken(resolvedCart.sessionToken);

    if (!refreshed) {
      throw new AppError('Cart not available', 500);
    }

    return this.cartRepository.mapCart(refreshed);
  }

  async updateItemQuantity(sessionToken: string, itemId: string, quantity: number): Promise<CartDTO> {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new AppError('Quantity must be zero or greater', 400);
    }

    const cart = await this.cartRepository.findCartBySessionToken(sessionToken);

    if (!cart || cart.status !== 'active') {
      throw new AppError('Cart not found', 404);
    }

    const item = cart.cart_items.find((entry) => entry.id === itemId);

    if (!item) {
      throw new AppError('Cart item not found', 404);
    }

    const variant = asSingle(item.product_variants);
    if (!variant) {
      throw new AppError('Variant not found', 404);
    }

    if (quantity > 0 && quantity > variant.stock) {
      throw new AppError('Insufficient stock', 400);
    }

    if (quantity === 0) {
      await this.cartRepository.removeCartItem(itemId);
    } else {
      await this.cartRepository.updateCartItemQuantity(itemId, quantity);
    }

    const refreshed = await this.cartRepository.findCartBySessionToken(sessionToken);

    if (!refreshed) {
      throw new AppError('Cart not available', 500);
    }

    return this.cartRepository.mapCart(refreshed);
  }

  async removeItem(sessionToken: string, itemId: string): Promise<CartDTO> {
    return this.updateItemQuantity(sessionToken, itemId, 0);
  }

  async checkout(sessionToken: string, input: CheckoutInputDTO): Promise<OrderDTO> {
    if (!sessionToken) {
      throw new AppError('Session is required', 400);
    }

    const cart = await this.cartRepository.findCartBySessionToken(sessionToken);

    if (!cart || cart.status !== 'active' || cart.cart_items.length === 0) {
      throw new AppError('Cart is empty', 400);
    }

    return this.cartRepository.checkoutCart(sessionToken, input);
  }
}
