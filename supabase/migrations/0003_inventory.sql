-- =====================================================================
-- 0003_inventory.sql — stock par boutique, mouvements, transferts, inventaires
-- =====================================================================

create type stock_movement_type as enum
  ('purchase_in', 'sale_out', 'return_in', 'transfer_out', 'transfer_in',
   'adjustment', 'inventory_correction');

create type transfer_status as enum
  ('requested', 'approved', 'preparing', 'shipped', 'received', 'cancelled');

-- Stock courant par produit et par boutique
create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 0,
  min_threshold integer not null default 0,
  max_threshold integer,
  updated_at timestamptz not null default now(),
  unique (store_id, product_id)
);

create index idx_inventory_store on public.inventory(store_id);
create index idx_inventory_low_stock on public.inventory(store_id) where quantity <= min_threshold;

create trigger trg_inventory_updated_at before update on public.inventory
  for each row execute function public.set_updated_at();

-- Historique de tous les mouvements de stock (source de vérité)
create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id),
  product_id uuid not null references public.products(id),
  movement_type stock_movement_type not null,
  quantity_delta integer not null, -- positif = entrée, négatif = sortie
  reference_table text,            -- ex: 'sales', 'purchase_orders', 'stock_transfers'
  reference_id uuid,
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index idx_inv_mov_store_product on public.inventory_movements(store_id, product_id);
create index idx_inv_mov_reference on public.inventory_movements(reference_table, reference_id);

-- Transferts entre boutiques
create table public.stock_transfers (
  id uuid primary key default gen_random_uuid(),
  transfer_number text not null unique,
  from_store_id uuid not null references public.stores(id),
  to_store_id uuid not null references public.stores(id),
  status transfer_status not null default 'requested',
  requested_by uuid references public.profiles(id),
  approved_by uuid references public.profiles(id),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_store_id <> to_store_id)
);

create table public.stock_transfer_items (
  id uuid primary key default gen_random_uuid(),
  transfer_id uuid not null references public.stock_transfers(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0)
);

create trigger trg_transfers_updated_at before update on public.stock_transfers
  for each row execute function public.set_updated_at();

-- Inventaires physiques
create table public.stock_counts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id),
  status text not null default 'in_progress', -- in_progress | validated | cancelled
  started_by uuid references public.profiles(id),
  validated_by uuid references public.profiles(id),
  started_at timestamptz not null default now(),
  validated_at timestamptz
);

create table public.stock_count_items (
  id uuid primary key default gen_random_uuid(),
  stock_count_id uuid not null references public.stock_counts(id) on delete cascade,
  product_id uuid not null references public.products(id),
  expected_quantity integer not null,
  counted_quantity integer,
  variance integer generated always as (coalesce(counted_quantity, 0) - expected_quantity) stored
);

-- ---------------------------------------------------------------------
-- RPC : ajuster le stock de façon atomique + tracer le mouvement
-- ---------------------------------------------------------------------
create or replace function public.apply_stock_movement(
  p_store_id uuid,
  p_product_id uuid,
  p_delta integer,
  p_type stock_movement_type,
  p_reference_table text default null,
  p_reference_id uuid default null,
  p_note text default null
) returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.inventory (store_id, product_id, quantity)
  values (p_store_id, p_product_id, 0)
  on conflict (store_id, product_id) do nothing;

  update public.inventory
     set quantity = quantity + p_delta,
         updated_at = now()
   where store_id = p_store_id and product_id = p_product_id;

  insert into public.inventory_movements
    (store_id, product_id, movement_type, quantity_delta, reference_table, reference_id, note, created_by)
  values
    (p_store_id, p_product_id, p_type, p_delta, p_reference_table, p_reference_id, p_note, auth.uid());
end;
$$;
