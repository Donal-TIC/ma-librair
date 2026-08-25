-- =====================================================================
-- 0006_returns_expenses.sql — retours, remboursements, dépenses
-- =====================================================================

create table public.returns (
  id uuid primary key default gen_random_uuid(),
  return_number text not null unique,
  sale_id uuid not null references public.sales(id),
  store_id uuid not null references public.stores(id),
  reason text,
  total_refund numeric(14,2) not null default 0,
  refund_method payment_method not null default 'cash',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references public.returns(id) on delete cascade,
  sale_item_id uuid not null references public.sale_items(id),
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null
);

create sequence if not exists public.return_number_seq;
create or replace function public.generate_return_number()
returns text language sql as $$
  select 'RET-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.return_number_seq')::text, 6, '0');
$$;

-- RPC : créer un retour, en empêchant de retourner plus que ce qui a été vendu
create or replace function public.create_return(
  p_sale_id uuid,
  p_store_id uuid,
  p_items jsonb, -- [{sale_item_id, product_id, quantity, unit_price}]
  p_reason text,
  p_refund_method payment_method default 'cash'
) returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_return_id uuid;
  v_item jsonb;
  v_already_returned integer;
  v_sold_qty integer;
  v_total numeric(14,2) := 0;
begin
  insert into public.returns (return_number, sale_id, store_id, reason, refund_method, created_by)
  values (public.generate_return_number(), p_sale_id, p_store_id, p_reason, p_refund_method, auth.uid())
  returning id into v_return_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select quantity into v_sold_qty from public.sale_items where id = (v_item->>'sale_item_id')::uuid;

    select coalesce(sum(ri.quantity), 0) into v_already_returned
      from public.return_items ri where ri.sale_item_id = (v_item->>'sale_item_id')::uuid;

    if v_already_returned + (v_item->>'quantity')::integer > v_sold_qty then
      raise exception 'Quantité retournée supérieure à la quantité vendue pour cette ligne';
    end if;

    insert into public.return_items (return_id, sale_item_id, product_id, quantity, unit_price)
    values (v_return_id, (v_item->>'sale_item_id')::uuid, (v_item->>'product_id')::uuid,
            (v_item->>'quantity')::integer, (v_item->>'unit_price')::numeric);

    v_total := v_total + (v_item->>'quantity')::integer * (v_item->>'unit_price')::numeric;

    perform public.apply_stock_movement(
      p_store_id, (v_item->>'product_id')::uuid, (v_item->>'quantity')::integer,
      'return_in', 'returns', v_return_id, 'Retour ' || v_return_id::text
    );
  end loop;

  update public.returns set total_refund = v_total where id = v_return_id;
  return v_return_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Dépenses
-- ---------------------------------------------------------------------
create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id),
  category_id uuid references public.expense_categories(id),
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  payment_method payment_method not null default 'cash',
  receipt_url text, -- justificatif dans Supabase Storage
  created_by uuid references public.profiles(id),
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index idx_expenses_store_date on public.expenses(store_id, expense_date desc);
