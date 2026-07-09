import { supabase } from '../../config/supabase.js';
import type { CartWithItems, OrderWithRelations, VariantWithProduct } from '../../types/database.js';
import { assertNoError, throwOnError, toPriceString } from '../../utils/supabase-error.js';
import { asSingle } from '../../utils/supabase-relations.js';
import type { CartDTO, CheckoutInputDTO, OrderDTO } from './cart.types.js';

const cartSelect = `
  id,
  session_token,
  status,
  cart_items (
    id,
    quantity,
    unit_price,
    product_variants (
      id,
      size,
      color,
      products (
        id,
        name,
        product_images (image_url, position, variant_id)
      )
    )
  )
`;

export class CartRepository {
  async findCartBySessionToken(sessionToken: string): Promise<CartWithItems | null> {
    const result = await supabase
      .from('carts')
      .select(cartSelect)
      .eq('session_token', sessionToken)
      .eq('status', 'active')
      .order('created_at', { foreignTable: 'cart_items', ascending: true })
      .maybeSingle();

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data as unknown as CartWithItems | null;
  }

  async createCart(sessionToken: string): Promise<CartWithItems> {
    const result = await supabase
      .from('carts')
      .insert({ session_token: sessionToken })
      .select(cartSelect)
      .single();

    return assertNoError(result, 'Failed to create cart') as unknown as CartWithItems;
  }

  async findVariantById(variantId: string): Promise<VariantWithProduct | null> {
    const result = await supabase
      .from('product_variants')
      .select(
        `
        id,
        stock,
        is_active,
        price_override,
        products!inner (id, name, base_price, is_active)
      `
      )
      .eq('id', variantId)
      .eq('is_active', true)
      .eq('products.is_active', true)
      .maybeSingle();

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data as unknown as VariantWithProduct | null;
  }

  async upsertCartItem(cartId: string, variantId: string, unitPrice: string, quantity: number): Promise<void> {
    const existingResult = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('variant_id', variantId)
      .maybeSingle();

    const existing = existingResult.data;

    if (existing) {
      const updateResult = await supabase
        .from('cart_items')
        .update({
          quantity: existing.quantity + quantity,
          unit_price: unitPrice
        })
        .eq('id', existing.id);

      throwOnError(updateResult.error, 'Failed to update cart item');
      return;
    }

    const insertResult = await supabase.from('cart_items').insert({
      cart_id: cartId,
      variant_id: variantId,
      quantity,
      unit_price: unitPrice
    });

    throwOnError(insertResult.error, 'Failed to add cart item');
  }

  resolveVariantPrice(variant: VariantWithProduct): string {
    const product = asSingle(variant.products);
    if (!product) {
      return '0.00';
    }

    return toPriceString(variant.price_override ?? product.base_price) ?? '0.00';
  }

  async updateCartItemQuantity(itemId: string, quantity: number): Promise<void> {
    const result = await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
    throwOnError(result.error, 'Failed to update cart item quantity');
  }

  async removeCartItem(itemId: string): Promise<void> {
    const result = await supabase.from('cart_items').delete().eq('id', itemId);
    throwOnError(result.error, 'Failed to remove cart item');
  }

  async checkoutCart(sessionToken: string, input: CheckoutInputDTO): Promise<OrderDTO> {
    const cart = await this.findCartBySessionToken(sessionToken);

    if (!cart || cart.status !== 'active' || cart.cart_items.length === 0) {
      throw new Error('Cart is empty');
    }

    const customerResult = await supabase
      .from('customers')
      .upsert(
        {
          full_name: input.fullName,
          email: input.email,
          phone: input.phone,
          cpf: input.cpf
        },
        { onConflict: 'cpf' }
      )
      .select('id, full_name, email, phone, cpf')
      .single();

    const customer = assertNoError(customerResult, 'Failed to upsert customer');

    const total = cart.cart_items.reduce((sum, item) => {
      const unitPrice = Number(toPriceString(item.unit_price) ?? '0');
      return sum + unitPrice * item.quantity;
    }, 0);

    const orderResult = await supabase
      .from('orders')
      .insert({
        customer_id: customer.id,
        cart_id: cart.id,
        total,
        shipping_address_line: input.shippingAddressLine,
        shipping_city: input.shippingCity,
        shipping_state: input.shippingState,
        shipping_postal_code: input.shippingPostalCode,
        payment_method: input.paymentMethod,
        payment_status: 'pending',
        payment_reference: input.paymentReference ?? null
      })
      .select('id, customer_id, cart_id, status, total, payment_method, payment_status, payment_reference, shipping_address_line, shipping_city, shipping_state, shipping_postal_code')
      .single();

    const order = assertNoError(orderResult, 'Failed to create order');

    const orderItemsResult = await supabase.from('order_items').insert(
      cart.cart_items.map((item) => {
        const variant = asSingle(item.product_variants);
        const product = variant ? asSingle(variant.products) : null;
        const unitPrice = Number(toPriceString(item.unit_price) ?? '0');
        const subtotal = unitPrice * item.quantity;

        return {
          order_id: order.id,
          variant_id: variant?.id,
          product_name: product?.name ?? '',
          size: variant?.size ?? '',
          color: variant?.color ?? '',
          quantity: item.quantity,
          unit_price: unitPrice,
          subtotal
        };
      })
    ).select('id, variant_id, product_name, size, color, quantity, unit_price, subtotal');

    const orderItems = assertNoError(orderItemsResult, 'Failed to create order items');

    const cartUpdateResult = await supabase.from('carts').update({ status: 'converted' }).eq('id', cart.id);
    throwOnError(cartUpdateResult.error, 'Failed to convert cart');

    const checkoutOrder = {
      ...order,
      customers: customer,
      order_items: orderItems.map((item) => ({ ...item, order_id: order.id }))
    } as OrderWithRelations;

    return this.mapOrder(checkoutOrder);
  }

  mapCart(cart: CartWithItems): CartDTO {
    const items = cart.cart_items.map((item) => {
      const variant = asSingle(item.product_variants);
      const product = variant ? asSingle(variant.products) : null;
      const unitPrice = Number(toPriceString(item.unit_price) ?? '0');
      const subtotal = unitPrice * item.quantity;
      const sortedImages = product ? [...product.product_images].sort((left, right) => left.position - right.position) : [];
      const imageUrl = sortedImages[0]?.image_url ?? null;

      return {
        id: item.id,
        variantId: variant?.id ?? '',
        productId: product?.id ?? '',
        productName: product?.name ?? '',
        size: variant?.size ?? '',
        color: variant?.color ?? '',
        quantity: item.quantity,
        unitPrice: toPriceString(item.unit_price) ?? '0.00',
        subtotal: subtotal.toFixed(2),
        imageUrl
      };
    });

    const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0);

    return {
      id: cart.id,
      sessionToken: cart.session_token,
      status: cart.status,
      items,
      subtotal: subtotal.toFixed(2),
      total: subtotal.toFixed(2)
    };
  }

  private mapOrder(order: OrderWithRelations): OrderDTO {
    return {
      id: order.id,
      status: order.status,
      total: toPriceString(order.total) ?? '0.00',
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      paymentReference: order.payment_reference,
      shippingAddressLine: order.shipping_address_line,
      shippingCity: order.shipping_city,
      shippingState: order.shipping_state,
      shippingPostalCode: order.shipping_postal_code,
      customer: {
        id: order.customers.id,
        fullName: order.customers.full_name,
        email: order.customers.email,
        phone: order.customers.phone,
        cpf: order.customers.cpf
      },
      items: order.order_items.map((item) => ({
        id: item.id,
        variantId: item.variant_id,
        productName: item.product_name,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unitPrice: toPriceString(item.unit_price) ?? '0.00',
        subtotal: toPriceString(item.subtotal) ?? '0.00'
      }))
    };
  }
}
