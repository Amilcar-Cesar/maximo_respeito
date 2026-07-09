# Máximo Respeito

Monorepo de e-commerce de roupas com:

- Frontend: Vite + React Router + TanStack Query
- Backend: Node.js + Express + TypeScript + Supabase JS
- Banco: Supabase PostgreSQL

## Requisitos

- Node.js 22+
- `npm`
- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` do projeto Supabase

## Instalação

```bash
npm install
```

## Desenvolvimento

Root dev (API + web juntos):

```bash
npm run dev
```

Backend:

```bash
npm run dev:api
```

Frontend:

```bash
npm run dev:web
```

## Verificação

```bash
npm run typecheck --workspace @maximo/api
npm run typecheck --workspace @maximo/web
```

## Banco

O schema está em `supabase/schema/schema.sql` com seed básico de categorias e produtos de exemplo. Execute no SQL Editor do Supabase.

## Supabase

A API usa `@supabase/supabase-js` com a `service_role` key (apenas no backend) para ler e gravar dados, ignorando RLS. Nunca exponha essa chave no frontend.

Variáveis em `.env`:

- `SUPABASE_URL` — URL do projeto (Project Settings > API)
- `SUPABASE_SERVICE_ROLE_KEY` — chave service_role (Project Settings > API)

## Admin

O login padrão do painel usa `admin` / `admin123`, configurável por `ADMIN_USERNAME` e `ADMIN_PASSWORD`.
