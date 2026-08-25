-- =====================================================================
-- 0005_pos_sales.sql — caisses, sessions, ventes, paiements (cœur du POS)
-- =====================================================================

create type cash_session_status as enum ('open', 'closed');
create type payment_method as enum ('cash', 'card', 'mobile_money', 'bank_transfer', 'other');
create type sale_status as enum ('completed', 'cancelled');

-- Une caisse physique par boutique (on peut en avoir plusieurs)
create table public.cash_registers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Une session = une ouverture -> fermeture de caisse par un caissier
create table public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  cash_register_id uuid not null references public.cash_registers(id),
  store_id uuid not null references public.stores(id),
  opened_by uuid not null references public.profiles(id),
  closed_by uuid references public.profiles(id),
  opening_amount numeric(14,2) not null default 0,
  expected_closing_amount numeric(14,2),
  counted_closing_amount numeric(14,2),
  variance numeric(14,2),
  variance_note text,
  status cash_session_status not null default 'open',
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create index idx_cash_sessions_open on public.cash_sessions(cash_register_id) where status = 'open';

-- Mouvements de caisse hors-vente (apports, sorties)
create type cash_movement_type as enum ('in', 'out');

create table public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  cash_session_id uuid not null references public.cash_sessions(id) on delete cascade,
  type cash_movement_type not null,
  amount numeric(14,2) not null check (amount > 0),
  reason text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Ventes
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_number text not null unique, -- ex VTE-2026-000001
  store_id uuid not null references public.stores(id),
  cash_session_id uuid not null references public.cash_sessions(id),
  cashier_id uuid not null references public.profiles(id),
  customer_id uuid references public.customers(id),
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  tax numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  status sale_status not null default 'completed',
  cancelled_reason text,
  created_at timestamptz not null default now()
);

create index idx_sales_store_date on public.sales(store_id, created_at desc);
create index idx_sales_cashier on public.sales(cashier_id);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  discount numeric(12,2) not null default 0,
  line_total numeric(14,2) not null
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  method payment_method not null,
  amount numeric(14,2) not null check (amount > 0),
  amount_received numeric(14,2), -- pour le calcul de la monnaie rendue (espèces)
  created_at timestamptz not null default now()
);

-- Numérotation automatique des ventes : VTE-{année}-{séquence}
create sequence if not exists public.sale_number_seq;

create or replace function public.generate_sale_number()
returns text language sql as $$
  select 'VTE-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.sale_number_seq')::text, 6, '0');
$$;

-- ---------------------------------------------------------------------
-- RPC : créer une vente complète de façon ATOMIQUE
-- (vente + lignes + paiement + déduction stock + mouvement stock)
-- p_items: jsonb array [{product_id, quantity, unit_price, discount}]
-- p_payments: jsonb array [{method, amount, amount_received}]
-- ---------------------------------------------------------------------
create or replace function public.create_sale(
  p_store_id uuid,
  p_cash_session_id uuid,
  p_customer_id uuid,
  p_items jsonb,
  p_payments jsonb,
  p_discount numeric default 0,
  p_allow_negative_stock boolean default false
) returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_sale_id uuid;
  v_item jsonb;
  v_payment jsonb;
  v_subtotal numeric(14,2) := 0;
  v_total numeric(14,2) := 0;
  v_line_total numeric(14,2);
  v_current_stock integer;
  v_session public.cash_sessions%rowtype;
  v_cashier uuid := auth.uid();
begin
  -- La caisse doit être ouverte
  select * into v_session from public.cash_sessions where id = p_cash_session_id for update;
  if not found or v_session.status <> 'open' then
    raise exception 'Impossible d''enregistrer une vente : la caisse n''est pas ouverte';
  end if;

  -- Calcul du sous-total
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_line_total := (v_item->>'quantity')::integer * (v_item->>'unit_price')::numeric
                     - coalesce((v_item->>'discount')::numeric, 0);
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  v_total := v_subtotal - coalesce(p_discount, 0);

  insert into public.sales (sale_number, store_id, cash_session_id, cashier_id, customer_id,
                             subtotal, discount, total)
  values (public.generate_sale_number(), p_store_id, p_cash_session_id, v_cashier, p_customer_id,
          v_subtotal, coalesce(p_discount, 0), v_total)
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_line_total := (v_item->>'quantity')::integer * (v_item->>'unit_price')::numeric
                     - coalesce((v_item->>'discount')::numeric, 0);

    insert into public.sale_items (sale_id, product_id, quantity, unit_price, discount, line_total)
    values (v_sale_id, (v_item->>'product_id')::uuid, (v_item->>'quantity')::integer,
            (v_item->>'unit_price')::numeric, coalesce((v_item->>'discount')::numeric, 0), v_line_total);

    -- Vérification du stock disponible (sauf option explicite)
    select quantity into v_current_stock from public.inventory
     where store_id = p_store_id and product_id = (v_item->>'product_id')::uuid
     for update;

    if not p_allow_negative_stock and coalesce(v_current_stock, 0) < (v_item->>'quantity')::integer then
      raise exception 'Stock insuffisant pour le produit %', (v_item->>'product_id')::text;
    end if;

    perform public.apply_stock_movement(
      p_store_id, (v_item->>'product_id')::uuid, -1 * (v_item->>'quantity')::integer,
      'sale_out', 'sales', v_sale_id, 'Vente ' || v_sale_id::text
    );
  end loop;

  for v_payment in select * from jsonb_array_elements(p_payments)
  loop
    insert into public.payments (sale_id, method, amount, amount_received)
    values (v_sale_id, (v_payment->>'method')::payment_method, (v_payment->>'amount')::numeric,
            nullif(v_payment->>'amount_received', '')::numeric);
  end loop;

  return v_sale_id;
end;
$$;
