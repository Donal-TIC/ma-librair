-- =====================================================================
-- 0002_catalog.sql — catégories, auteurs, éditeurs, fournisseurs, produits, clients
-- =====================================================================

create extension if not exists pg_trgm;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references public.categories(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.publishers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  country text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text,
  email text,
  address text,
  payment_terms text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  phone text,
  email text,
  address text,
  notes text,
  is_walk_in boolean not null default false, -- « Client comptoir »
  created_at timestamptz not null default now()
);

-- Client comptoir unique, créé une fois (voir seed.sql)

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  isbn text,
  barcode text,
  internal_ref text,
  description text,
  image_url text,
  author_id uuid references public.authors(id) on delete set null,
  publisher_id uuid references public.publishers(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  purchase_price numeric(12,2) not null default 0 check (purchase_price >= 0),
  sale_price numeric(12,2) not null default 0 check (sale_price >= 0),
  promo_price numeric(12,2) check (promo_price is null or promo_price >= 0),
  vat_rate numeric(5,2) not null default 0,
  unit text not null default 'unité',
  supplier_id uuid references public.suppliers(id) on delete set null,
  default_location text,
  is_active boolean not null default true,
  deleted_at timestamptz, -- suppression logique
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index uq_products_barcode on public.products(barcode) where barcode is not null and deleted_at is null;
create index idx_products_isbn on public.products(isbn);
create index idx_products_category on public.products(category_id);
create index idx_products_active on public.products(is_active) where deleted_at is null;
create index idx_products_name_trgm on public.products using gin (name gin_trgm_ops);

create trigger trg_products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
