export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  base_price: string | number;
  category_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariantRow {
  id: string;
  product_id: string;
  size: string;
  color: string;
  sku: string | null;
  price_override: string | number | null;
  stock: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductImageRow {
  id: string;
  product_id: string;
  variant_id: string | null;
  image_url: string;
  position: number;
  created_at?: string;
}

export interface CartRow {
  id: string;
  session_token: string;
  status: 'active' | 'converted' | 'abandoned';
  created_at?: string;
  updated_at?: string;
}

export interface CartItemRow {
  id: string;
  cart_id: string;
  variant_id: string;
  quantity: number;
  unit_price: string | number;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  cpf: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrderRow {
  id: string;
  customer_id: string;
  cart_id: string | null;
  status: string;
  total: string | number;
  shipping_address_line: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  payment_method: 'pix' | 'credit_card';
  payment_status: string;
  payment_reference: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  variant_id: string;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: string | number;
  subtotal: string | number;
  created_at?: string;
}

export type ProductWithRelations = ProductRow & {
  categories: CategoryRow | CategoryRow[] | null;
  product_images: ProductImageRow[];
  product_variants: ProductVariantRow[];
};

export type ProductWithCategoryName = ProductRow & {
  categories: Pick<CategoryRow, 'name'> | Pick<CategoryRow, 'name'>[] | null;
  product_variants: ProductVariantRow[];
  product_images: ProductImageRow[];
};

export type CartItemWithRelations = Pick<CartItemRow, 'id' | 'quantity' | 'unit_price'> & {
  product_variants:
    | (ProductVariantRow & {
        products:
          | (ProductRow & {
              product_images: Pick<ProductImageRow, 'image_url' | 'position' | 'variant_id'>[];
            })
          | (ProductRow & {
              product_images: Pick<ProductImageRow, 'image_url' | 'position' | 'variant_id'>[];
            })[];
      })
    | (ProductVariantRow & {
        products:
          | (ProductRow & {
              product_images: Pick<ProductImageRow, 'image_url' | 'position' | 'variant_id'>[];
            })
          | (ProductRow & {
              product_images: Pick<ProductImageRow, 'image_url' | 'position' | 'variant_id'>[];
            })[];
      })[];
};

export type CartWithItems = CartRow & {
  cart_items: CartItemWithRelations[];
};

export type VariantWithProduct = ProductVariantRow & {
  products: Pick<ProductRow, 'id' | 'name' | 'base_price' | 'is_active'> | Pick<ProductRow, 'id' | 'name' | 'base_price' | 'is_active'>[];
};

export type OrderWithRelations = OrderRow & {
  customers: CustomerRow;
  order_items: OrderItemRow[];
};
