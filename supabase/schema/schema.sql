-- =========================================================
-- SCHEMA: Catálogo de Roupas + Carrinho por Sessão + Checkout Guest
-- Fluxo: navega sem login -> carrinho por cookie de sessão ->
--        confirmação de itens -> pré-cadastro (nome/email/tel/CPF) -> pagamento (PIX/Cartão)
-- Para rodar no SQL Editor do Supabase
-- =========================================================

create extension if not exists "pgcrypto";

-- =========================================================
-- 1. FUNÇÃO AUXILIAR: atualizar automaticamente "updated_at"
-- =========================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;


-- =========================================================
-- 2. CATEGORIAS
-- =========================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);


-- =========================================================
-- 3. PRODUTOS (dados "gerais", sem tamanho/cor/estoque específico)
-- =========================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  base_price numeric(10, 2) not null check (base_price >= 0),
  category_id uuid references public.categories(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_active on public.products(is_active);

create trigger trg_products_updated_at
before update on public.products
for each row execute function set_updated_at();


-- =========================================================
-- 4. VARIAÇÕES DE PRODUTO (tamanho/cor = os "seletores" da página de produto)
-- =========================================================
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,               -- PP, P, M, G, GG ou numérico
  color text not null,
  sku text unique,
  -- price_override permite variação pontual de preço (ex: cor limitada mais cara); se null, usa products.base_price
  price_override numeric(10, 2) check (price_override >= 0),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, size, color)
);

create index if not exists idx_variants_product on public.product_variants(product_id);
create index if not exists idx_variants_active on public.product_variants(is_active);

create trigger trg_variants_updated_at
before update on public.product_variants
for each row execute function set_updated_at();


-- =========================================================
-- 5. IMAGENS DE PRODUTOS
-- =========================================================
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  -- opcional: imagem pode ser específica de uma variação (ex: foto da cor azul)
  variant_id uuid references public.product_variants(id) on delete cascade,
  image_url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_images_product on public.product_images(product_id);
create index if not exists idx_product_images_variant on public.product_images(variant_id);


-- =========================================================
-- 6. CARRINHOS (100% por sessão via cookie, sem login)
-- =========================================================
create type cart_status as enum ('active', 'converted', 'abandoned');

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  -- token gerado pelo backend, guardado num cookie httpOnly no navegador do visitante
  session_token uuid not null,
  status cart_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_carts_session_token on public.carts(session_token);
create index if not exists idx_carts_status on public.carts(status);

create trigger trg_carts_updated_at
before update on public.carts
for each row execute function set_updated_at();

-- Só 1 carrinho "active" por sessão
create unique index if not exists uq_one_active_cart_per_session
on public.carts(session_token)
where (status = 'active');


-- =========================================================
-- 7. ITENS DO CARRINHO (referenciam a VARIAÇÃO, não o produto genérico)
-- =========================================================
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0), -- snapshot do preço no momento em que foi adicionado
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create index if not exists idx_cart_items_cart on public.cart_items(cart_id);
create index if not exists idx_cart_items_variant on public.cart_items(variant_id);

create trigger trg_cart_items_updated_at
before update on public.cart_items
for each row execute function set_updated_at();


-- =========================================================
-- 8. CLIENTES (pré-cadastro rápido antes do pagamento, sem conta/login)
-- =========================================================
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  cpf text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CPF identifica o mesmo cliente em compras futuras (não é login, só reconhecimento)
create unique index if not exists uq_customers_cpf on public.customers(cpf);
create index if not exists idx_customers_email on public.customers(email);

create trigger trg_customers_updated_at
before update on public.customers
for each row execute function set_updated_at();


-- =========================================================
-- 9. PEDIDOS
-- =========================================================
create type order_status as enum (
  'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'
);

create type payment_method as enum ('pix', 'credit_card');

create type payment_status as enum ('pending', 'approved', 'rejected', 'refunded');

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  cart_id uuid references public.carts(id) on delete set null,
  status order_status not null default 'pending',
  total numeric(10, 2) not null check (total >= 0),

  shipping_address_line text not null,
  shipping_city text not null,
  shipping_state text not null,
  shipping_postal_code text not null,

  payment_method payment_method not null,
  payment_status payment_status not null default 'pending',
  payment_reference text,   -- id da transação/QR code no gateway (PIX) ou id da cobrança (cartão)

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_payment_status on public.orders(payment_status);

create trigger trg_orders_updated_at
before update on public.orders
for each row execute function set_updated_at();


-- =========================================================
-- 10. ITENS DO PEDIDO (snapshot congelado)
-- =========================================================
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  product_name text not null,   -- snapshot (nome do produto no momento da compra)
  size text not null,           -- snapshot da variação
  color text not null,          -- snapshot da variação
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_order_items_variant on public.order_items(variant_id);


-- =========================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- =========================================================
-- Como NÃO existe Supabase Auth nesse fluxo (sem login), quem fala com o Supabase
-- é sempre o backend Node.js usando a service_role key (que ignora RLS por padrão).
-- O RLS aqui serve para bloquear qualquer acesso direto via chave anon do frontend,
-- exceto leitura pública do catálogo (produtos/variações/imagens/categorias).

alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.categories enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Catálogo: leitura pública liberada (para o front poder listar/filtrar produtos)
create policy "products_select_public"
on public.products for select
using (is_active = true);

create policy "variants_select_public"
on public.product_variants for select
using (is_active = true);

create policy "product_images_select_public"
on public.product_images for select
using (true);

create policy "categories_select_public"
on public.categories for select
using (true);

-- carts, cart_items, customers, orders, order_items:
-- Nenhuma policy de select/insert/update/delete para a chave "anon" —
-- ou seja, RLS ativo + sem policies = acesso NEGADO por padrão para o frontend.
-- Só o backend (service_role) consegue ler/escrever essas tabelas.


-- =========================================================
-- 12. DADOS DE EXEMPLO (opcional — remova em produção)
-- =========================================================
insert into public.categories (name, slug) values
  ('Camisetas', 'camisetas'),
  ('Calças', 'calcas'),
  ('Jaquetas', 'jaquetas')
on conflict (name) do nothing;

insert into public.products (name, description, base_price, category_id)
select 'Camiseta Oversized Areia', 'Camiseta premium de algodão com modelagem ampla.', 129.90, c.id
from public.categories c
where c.slug = 'camisetas'
  and not exists (
    select 1 from public.products p where p.name = 'Camiseta Oversized Areia'
  );

insert into public.products (name, description, base_price, category_id)
select 'Calça Reta Canvas', 'Calça estruturada para uso diário com corte limpo.', 219.90, c.id
from public.categories c
where c.slug = 'calcas'
  and not exists (
    select 1 from public.products p where p.name = 'Calça Reta Canvas'
  );

insert into public.product_variants (product_id, size, color, sku, price_override, stock)
select p.id, v.size, v.color, v.sku, v.price_override, v.stock
from public.products p
join (
  values
    ('Camiseta Oversized Areia', 'P', 'Areia', 'CAM-AREIA-P', null, 12),
    ('Camiseta Oversized Areia', 'M', 'Areia', 'CAM-AREIA-M', null, 18),
    ('Calça Reta Canvas', '38', 'Preto', 'CAL-PRETO-38', null, 8),
    ('Calça Reta Canvas', '40', 'Preto', 'CAL-PRETO-40', null, 6)
) as v(product_name, size, color, sku, price_override, stock)
  on v.product_name = p.name
on conflict (product_id, size, color) do nothing;

insert into public.product_images (product_id, image_url, position)
select p.id, v.image_url, v.position
from public.products p
join (
  values
    ('Camiseta Oversized Areia', 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80', 0),
    ('Calça Reta Canvas', 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1200&q=80', 0)
) as v(product_name, image_url, position)
  on v.product_name = p.name
where not exists (
  select 1 from public.product_images pi
  where pi.product_id = p.id and pi.position = v.position
);