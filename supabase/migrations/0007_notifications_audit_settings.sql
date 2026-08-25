-- =====================================================================
-- 0007_notifications_audit_settings.sql
-- =====================================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade, -- null = notification globale boutique
  type text not null, -- 'low_stock' | 'out_of_stock' | 'cash_to_close' | 'transfer_pending' | ...
  title text not null,
  message text not null,
  severity text not null default 'info', -- info | warning | critical
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_unread on public.notifications(user_id) where is_read = false;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  store_id uuid references public.stores(id),
  action text not null,          -- ex: 'sale.cancel', 'product.update', 'cash_session.close'
  object_table text,
  object_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_store_date on public.audit_logs(store_id, created_at desc);
create index idx_audit_logs_user on public.audit_logs(user_id);

-- Paramètres globaux (librairie) et par boutique — clé/valeur souple
create table public.settings (
  id uuid primary key default gen_random_uuid(),
  scope text not null default 'global', -- 'global' | 'store'
  store_id uuid references public.stores(id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  unique (scope, store_id, key)
);

-- ---------------------------------------------------------------------
-- Fonction : réévaluer les alertes de stock d'une boutique après un mouvement
-- Appelée par un trigger sur inventory (simple, sans complexité offline)
-- ---------------------------------------------------------------------
create or replace function public.check_stock_alert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_product_name text;
begin
  if new.quantity <= 0 then
    select name into v_product_name from public.products where id = new.product_id;
    insert into public.notifications (store_id, type, title, message, severity)
    values (new.store_id, 'out_of_stock', 'Rupture de stock',
            'Rupture de stock : "' || v_product_name || '"', 'critical');
  elsif new.quantity <= new.min_threshold then
    select name into v_product_name from public.products where id = new.product_id;
    insert into public.notifications (store_id, type, title, message, severity)
    values (new.store_id, 'low_stock', 'Stock faible',
            'Attention : "' || v_product_name || '" n''a plus que ' || new.quantity || ' exemplaire(s).', 'warning');
  end if;
  return new;
end;
$$;

create trigger trg_inventory_stock_alert
  after update of quantity on public.inventory
  for each row
  when (new.quantity <= new.min_threshold and (old.quantity is distinct from new.quantity))
  execute function public.check_stock_alert();
