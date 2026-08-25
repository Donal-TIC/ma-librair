-- =====================================================================
-- 0004_purchases.sql — commandes d'achat fournisseurs
-- =====================================================================

create type purchase_status as enum
  ('draft', 'ordered', 'partially_received', 'received', 'cancelled');

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  store_id uuid not null references public.stores(id),
  supplier_id uuid not null references public.suppliers(id),
  status purchase_status not null default 'draft',
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  tax numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  order_date date not null default current_date,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity_ordered integer not null check (quantity_ordered > 0),
  quantity_received integer not null default 0,
  unit_price numeric(12,2) not null check (unit_price >= 0)
);

create trigger trg_po_updated_at before update on public.purchase_orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- RPC : réceptionner (totalement ou partiellement) une ligne de commande
-- Met à jour le stock de façon atomique
-- ---------------------------------------------------------------------
create or replace function public.receive_purchase_order_item(
  p_item_id uuid,
  p_quantity integer
) returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_item public.purchase_order_items%rowtype;
  v_po public.purchase_orders%rowtype;
  v_remaining integer;
begin
  select * into v_item from public.purchase_order_items where id = p_item_id for update;
  if not found then
    raise exception 'Ligne de commande introuvable';
  end if;

  v_remaining := v_item.quantity_ordered - v_item.quantity_received;
  if p_quantity <= 0 or p_quantity > v_remaining then
    raise exception 'Quantité de réception invalide (reste à recevoir: %)', v_remaining;
  end if;

  select * into v_po from public.purchase_orders where id = v_item.purchase_order_id for update;

  update public.purchase_order_items
     set quantity_received = quantity_received + p_quantity
   where id = p_item_id;

  perform public.apply_stock_movement(
    v_po.store_id, v_item.product_id, p_quantity, 'purchase_in',
    'purchase_orders', v_po.id, 'Réception commande ' || v_po.order_number
  );

  update public.purchase_orders
     set status = case
           when (select sum(quantity_ordered - quantity_received) from public.purchase_order_items where purchase_order_id = v_po.id) = 0
             then 'received'::purchase_status
           else 'partially_received'::purchase_status
         end
   where id = v_po.id;
end;
$$;
