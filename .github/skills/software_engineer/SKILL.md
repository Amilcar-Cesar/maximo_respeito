# skills.md

# E-commerce de Roupas
## Guia de Arquitetura e Desenvolvimento

---

# Objetivo

Desenvolver um catálogo de roupas moderno utilizando:

Frontend
- React
- TypeScript
- React Router
- TanStack Query
- Axios
- TailwindCSS
- Shadcn/ui

Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- Supabase PostgreSQL


Banco

- Supabase PostgreSQL

Arquitetura

- Clean Architecture
- SOLID
- Repository Pattern
- Dependency Injection
- DTO
- Services
- Controllers
- Middlewares

Versionamento

- Git
- GitHub

---

# Objetivos da Arquitetura

Separar responsabilidades.

Nunca acessar o banco diretamente pelo controller.

Toda regra de negócio deve ficar na camada Service ou UseCase.

Toda comunicação com o banco deve passar por Repository.

---

# Estrutura Backend

src/

    main/
        server.ts

    config/
        env.ts
        prisma.ts

    controllers/

    routes/

    middlewares/

    services/

    repositories/

    interfaces/

    dto/

    entities/

    useCases/

    validators/

    utils/

    errors/

---

# Estrutura Frontend

src/

    assets/

    components/

    pages/

    hooks/

    services/

    contexts/

    routes/

    layouts/

    utils/

    types/

---

# Entidades


---

# Fluxo

Usuário

↓

Produtos

↓

Adicionar ao carrinho

↓

Editar carrinho

↓

Login (pré cadastro rapido: email, telefone, nome completo e cpf)

↓

Endereço

↓

Pagamento

↓

Pedido criado

↓

Painel administrativo

---

# Funcionalidades

## Cliente

Catálogo

Busca

Filtro

Categorias

Produtos relacionados

Carrinho

Favoritos

Checkout

Pedidos

Avaliações

---

## Administrador

Dashboard

Cadastrar produtos

Editar produtos

Excluir produtos

Cadastrar categorias

Gerenciar pedidos

Estoque

Relatórios

---

# Banco

Supabase PostgreSQL

---

# Upload

Imagens

Supabase Storage

Salvar apenas URL da imagem.

---

# Frontend

Páginas

Home

Catálogo

Produto

Carrinho

Checkout

Cadastro

Pedidos

Admin



# React

Hooks

useAuth

useCart

useProducts

useCategories

useOrders

useFavorites

---

# Estados

TanStack Query

Cache

Mutations

Invalidation

Optimistic Update

---

# Boas práticas

Nunca repetir código.

Componentes pequenos.

Funções curtas.

Interfaces bem definidas.

Cada classe possui apenas uma responsabilidade.

Não misturar regra de negócio com controller.

Sempre utilizar TypeScript.

Sempre tipar respostas da API.

Nunca acessar Prisma diretamente pelo Controller.

---

# Testes

Backend

Supertest

Frontend

React Testing Library

---

# Futuras melhorias

Pagamento Stripe

Mercado Pago

PIX

Frete

Correios

Melhor Envio

Cupom

Lista de desejos

Chat

Notificações

Dashboard Analytics

Integração WhatsApp

Sistema de recomendações

IA para descrição automática dos produtos

---

# Convenções

Commits

feat:

fix:

refactor:

docs:

style:

test:

build:

chore:

---

# Objetivo Final

Construir uma aplicação de nível profissional seguindo padrões utilizados no mercado, priorizando escalabilidade, legibilidade, testabilidade e manutenção do código.