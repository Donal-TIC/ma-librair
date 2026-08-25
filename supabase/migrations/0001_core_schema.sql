-- =====================================================================
-- 0001_core_schema.sql
-- La librairie de Katiola — schéma de base : rôles, profils, boutiques
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------
create type app_role as enum ('owner', 'manager', 'cashier', 'accountant', 'stock_manager', 'supervisor');
create type user_status as enum ('active', 'disabled');
create type store_status as enum ('active', 'inactive');

-- ---------------------------------------------------------------------
-- PROFILES  (1-1 avec auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text,
  email text not null,
  status user_status not null default 'active',
  is_owner boolean not null default false, -- le tout premier compte créateur du compte librairie
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Profil applicatif lié 1-1 à auth.users. Le rôle métier est porté par user_roles (pas ici) afin de permettre plusieurs rôles/boutiques.';

-- ---------------------------------------------------------------------
-- STORES (boutiques)
-- ---------------------------------------------------------------------
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  address text,
  phone text,
  email text,
  manager_id uuid references public.profiles(id) on delete set null,
  opening_hours text,
  status store_status not null default 'active',
  settings jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- USER_ROLES  (rôle applicatif global — indépendant de la boutique)
-- ---------------------------------------------------------------------
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- ---------------------------------------------------------------------
-- STORE_USERS  (association utilisateur <-> boutique(s))
-- ---------------------------------------------------------------------
create table public.store_users (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role app_role not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (store_id, user_id)
);

create index idx_store_users_user on public.store_users(user_id);
create index idx_store_users_store on public.store_users(store_id);

-- ---------------------------------------------------------------------
-- PERMISSIONS  (catalogue) + ROLE_PERMISSIONS (matrice rôle -> permission)
-- ---------------------------------------------------------------------
create table public.permissions (
  key text primary key,          -- ex: 'products.create'
  label text not null,
  category text not null
);

create table public.role_permissions (
  role app_role not null,
  permission_key text not null references public.permissions(key) on delete cascade,
  primary key (role, permission_key)
);

-- ---------------------------------------------------------------------
-- Trigger générique updated_at
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_stores_updated_at before update on public.stores
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Fonction utilitaire : synchroniser un nouvel utilisateur Supabase Auth
-- vers profiles (déclenché depuis auth.users)
-- ---------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', 'Nouveau'),
    coalesce(new.raw_user_meta_data->>'last_name', 'Utilisateur'),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
