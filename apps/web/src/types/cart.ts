export interface CartItemDTO {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  imageUrl: string | null;
}

export interface CartDTO {
  id: string;
  sessionToken: string;
  status: 'active' | 'converted' | 'abandoned';
  items: CartItemDTO[];
  subtotal: string;
  total: string;
}

export interface CheckoutInputDTO {
  fullName: string;
  email: string;
  phone: string;
  cpf: string;
  shippingAddressLine: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  paymentMethod: 'pix' | 'credit_card';
  paymentReference?: string;
}

export interface OrderItemDTO {
  id: string;
  variantId: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
}

export interface OrderDTO {
  id: string;
  status: string;
  total: string;
  paymentMethod: 'pix' | 'credit_card';
  paymentStatus: string;
  paymentReference: string | null;
  shippingAddressLine: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  customer: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    cpf: string;
  };
  items: OrderItemDTO[];
}
