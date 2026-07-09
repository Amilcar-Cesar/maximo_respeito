import type { Request, Response } from 'express';
import { z } from 'zod';
import { CartService } from './cart.service.js';

const cookieName = 'cart_session_token';

const checkoutSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(8),
  cpf: z.string().min(11),
  shippingAddressLine: z.string().min(3),
  shippingCity: z.string().min(2),
  shippingState: z.string().min(2),
  shippingPostalCode: z.string().min(5),
  paymentMethod: z.enum(['pix', 'credit_card']),
  paymentReference: z.string().optional()
});

const cartItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive()
});

const updateItemSchema = z.object({
  quantity: z.number().int().nonnegative()
});

function readSessionToken(request: Request) {
  const cookieHeader = request.headers.cookie;
  const cookieToken = cookieHeader
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`))
    ?.split('=')[1];

  const headerToken = request.header('x-session-token');

  return cookieToken ?? headerToken ?? undefined;
}

function setSessionCookie(response: Response, sessionToken: string) {
  response.cookie(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 30
  });
}

export class CartController {
  constructor(private readonly cartService = new CartService()) {}

  getCart = async (request: Request, response: Response) => {
    const sessionToken = readSessionToken(request);
    const cart = await this.cartService.getOrCreateCart(sessionToken);
    setSessionCookie(response, cart.sessionToken);
    response.json({ data: cart });
  };

  addItem = async (request: Request, response: Response) => {
    const sessionToken = readSessionToken(request);
    const payload = cartItemSchema.parse(request.body);
    const cart = await this.cartService.addItem(sessionToken, payload.variantId, payload.quantity);
    setSessionCookie(response, cart.sessionToken);
    response.status(201).json({ data: cart });
  };

  updateItem = async (request: Request, response: Response) => {
    const sessionToken = readSessionToken(request);
    const { itemId } = request.params;
    const cartItemId = typeof itemId === 'string' ? itemId : '';
    const payload = updateItemSchema.parse(request.body);
    const cart = await this.cartService.updateItemQuantity(sessionToken ?? '', cartItemId, payload.quantity);
    setSessionCookie(response, cart.sessionToken);
    response.json({ data: cart });
  };

  removeItem = async (request: Request, response: Response) => {
    const sessionToken = readSessionToken(request);
    const { itemId } = request.params;
    const cartItemId = typeof itemId === 'string' ? itemId : '';
    const cart = await this.cartService.removeItem(sessionToken ?? '', cartItemId);
    setSessionCookie(response, cart.sessionToken);
    response.json({ data: cart });
  };

  checkout = async (request: Request, response: Response) => {
    const sessionToken = readSessionToken(request);
    const payload = checkoutSchema.parse(request.body);
    const order = await this.cartService.checkout(sessionToken ?? '', payload);
    response.status(201).json({ data: order });
  };
}
