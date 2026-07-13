# Máximo Respeito

Monorepo de e-commerce de roupas com:

- Frontend: Vite + React Router + TanStack Query
- Backend: Node.js + Express + TypeScript + Supabase JS (Netlify Functions em produção)
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

### Local (API + web separados)

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

Use `VITE_API_URL=http://localhost:3333` no `.env` (padrão do `.env.example`).

### Netlify (ambiente igual à produção)

Simula o deploy com functions e redirects:

```bash
npm run dev:netlify
```

Abre em `http://localhost:8888`. Deixe `VITE_API_URL` vazio no `.env` para que o frontend chame a API na mesma origem.

## Deploy (Netlify)

1. Conecte o repositório no Netlify.
2. O `netlify.toml` na raiz já define build, publish e functions.
3. Configure as variáveis de ambiente no painel do Netlify:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `ADMIN_TOKEN_SECRET`
   - `NODE_ENV=production`
4. Não defina `VITE_API_URL` — o frontend usa URLs relativas (`/api/...`).

A API Express roda como uma única Netlify Function em `netlify/functions/api.ts`, reutilizando o código de `apps/api`.

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
