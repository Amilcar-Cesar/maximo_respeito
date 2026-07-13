-- =========================================================
-- SCHEMA EXTENSION: Tabela de Administradores + Autenticação
-- =========================================================

-- Certifique-se de que pgcrypto esteja ativo
create extension if not exists "pgcrypto";

-- 1. Criar Tabela de Administradores
create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Trigger para atualizar updated_at automaticamente
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_admins_updated_at
before update on public.admins
for each row execute function set_updated_at();

-- 3. Habilitar RLS (Row Level Security) para segurança
-- Por padrão, nenhuma política pública é definida, bloqueando acesso externo direto (anon).
alter table public.admins enable row level security;

-- 4. Função auxiliar para verificar login comparando a senha
create or replace function public.verify_admin_password(p_username text, p_password text)
returns table (id uuid, username text) as $$
begin
  return query
  select a.id, a.username
  from public.admins a
  where a.username = p_username
    and a.password_hash = crypt(p_password, a.password_hash);
end;
$$ language plpgsql security definer;

-- 5. Inserir administrador padrão com base nas credenciais do .env (admin / admin123)
insert into public.admins (username, password_hash)
values ('admin', crypt('admin123', gen_salt('bf')))
on conflict (username) do nothing;
