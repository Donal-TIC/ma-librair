-- =====================================================================
-- 0009_rls_policies.sql — RLS activé + policies sur toutes les tables
-- Principe : le frontend n'est JAMAIS le mécanisme de sécurité.
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.user_roles enable row level security;
alter table public.store_users enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.categories enable row level security;
alter table public.authors enable row level security;
alter table public.publishers enable row level security;
alter table public.suppliers enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.stock_transfers enable row level security;
alter table public.stock_transfer_items enable row level security;
alter table public.stock_counts enable row level security;
alter table public.stock_count_items enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.cash_registers enable row level security;
alter table public.cash_sessions enable row level security;
alter table public.cash_movements enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.payments enable row level security;
alter table public.returns enable row level security;
alter table public.return_items enable row level security;
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.settings enable row level security;

-- ---------------------------------------------------------------------
-- PROFILES : chacun voit son propre profil ; owner voit tout le monde ;
-- un manager voit les profils des utilisateurs de ses boutiques.
-- ---------------------------------------------------------------------
create policy profiles_select on public.profiles for select
  using (
    id = auth.uid()
    or public.is_owner()
    or exists (
      select 1 from public.store_users su1
      join public.store_users su2 on su2.store_id = su1.store_id
      where su1.user_id = auth.uid() and su2.user_id = public.profiles.id
    )
  );

create policy profiles_update_self on public.profiles for update
  using (id = auth.uid() or public.is_owner());

create policy profiles_insert_owner on public.profiles for insert
  with check (public.is_owner() or id = auth.uid());

-- ---------------------------------------------------------------------
-- STORES : visibles par les utilisateurs qui y sont rattachés ; owner = tout
-- ---------------------------------------------------------------------
create policy stores_select on public.stores for select
  using (public.has_store_access(id));

create policy stores_write_owner on public.stores for insert
  with check (public.is_owner());
create policy stores_update_owner on public.stores for update
  using (public.is_owner());

-- ---------------------------------------------------------------------
-- USER_ROLES / STORE_USERS : gestion réservée owner/manager avec permission
-- ---------------------------------------------------------------------
create policy user_roles_select on public.user_roles for select
  using (user_id = auth.uid() or public.is_owner());
create policy user_roles_write on public.user_roles for all
  using (public.is_owner()) with check (public.is_owner());

create policy store_users_select on public.store_users for select
  using (user_id = auth.uid() or public.has_store_access(store_id));
create policy store_users_write on public.store_users for all
  using (public.is_owner() or public.has_permission(store_id, 'users.create'))
  with check (public.is_owner() or public.has_permission(store_id, 'users.create'));

-- ---------------------------------------------------------------------
-- PERMISSIONS / ROLE_PERMISSIONS : lecture pour tous les authentifiés,
-- écriture réservée owner
-- ---------------------------------------------------------------------
create policy permissions_select on public.permissions for select using (auth.uid() is not null);
create policy role_permissions_select on public.role_permissions for select using (auth.uid() is not null);
create policy role_permissions_write on public.role_permissions for all
  using (public.is_owner()) with check (public.is_owner());

-- ---------------------------------------------------------------------
-- CATALOGUE PARTAGÉ (catégories, auteurs, éditeurs, fournisseurs) :
-- lecture pour tout utilisateur ayant au moins une boutique, écriture avec permission
-- ---------------------------------------------------------------------
create policy catalog_select_categories on public.categories for select using (auth.uid() is not null);
create policy catalog_write_categories on public.categories for all
  using (public.is_owner() or exists (
    select 1 from public.store_users su join public.role_permissions rp on rp.role = su.role
    where su.user_id = auth.uid() and rp.permission_key = 'products.update'))
  with check (public.is_owner() or exists (
    select 1 from public.store_users su join public.role_permissions rp on rp.role = su.role
    where su.user_id = auth.uid() and rp.permission_key = 'products.update'));

create policy catalog_select_authors on public.authors for select using (auth.uid() is not null);
create policy catalog_write_authors on public.authors for all
  using (public.is_owner()) with check (public.is_owner());

create policy catalog_select_publishers on public.publishers for select using (auth.uid() is not null);
create policy catalog_write_publishers on public.publishers for all
  using (public.is_owner()) with check (public.is_owner());

create policy catalog_select_suppliers on public.suppliers for select using (auth.uid() is not null);
create policy catalog_write_suppliers on public.suppliers for all
  using (public.is_owner()) with check (public.is_owner());

create policy customers_select on public.customers for select using (auth.uid() is not null);
create policy customers_write on public.customers for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

-- ---------------------------------------------------------------------
-- PRODUCTS : lecture pour tout utilisateur connecté (catalogue global),
-- écriture réservée à qui a la permission products.*
-- ---------------------------------------------------------------------
create policy products_select on public.products for select using (auth.uid() is not null);

create policy products_insert on public.products for insert
  with check (public.is_owner() or exists (
    select 1 from public.store_users su join public.role_permissions rp on rp.role = su.role
    where su.user_id = auth.uid() and rp.permission_key = 'products.create'));

create policy products_update on public.products for update
  using (public.is_owner() or exists (
    select 1 from public.store_users su join public.role_permissions rp on rp.role = su.role
    where su.user_id = auth.uid() and rp.permission_key = 'products.update'));

create policy products_delete on public.products for delete
  using (public.is_owner());

-- ---------------------------------------------------------------------
-- INVENTORY / MOVEMENTS : strictement scoping par boutique
-- ---------------------------------------------------------------------
create policy inventory_select on public.inventory for select
  using (public.has_store_access(store_id));
create policy inventory_write on public.inventory for all
  using (public.has_permission(store_id, 'stock.manage'))
  with check (public.has_permission(store_id, 'stock.manage'));

create policy inventory_movements_select on public.inventory_movements for select
  using (public.has_store_access(store_id));
create policy inventory_movements_insert on public.inventory_movements for insert
  with check (public.has_store_access(store_id)); -- écriture normalement via RPC security definer

-- ---------------------------------------------------------------------
-- TRANSFERTS : visibles par les deux boutiques concernées
-- ---------------------------------------------------------------------
create policy transfers_select on public.stock_transfers for select
  using (public.has_store_access(from_store_id) or public.has_store_access(to_store_id));
create policy transfers_write on public.stock_transfers for all
  using (public.has_store_access(from_store_id) or public.has_store_access(to_store_id))
  with check (public.has_store_access(from_store_id) or public.has_store_access(to_store_id));

create policy transfer_items_select on public.stock_transfer_items for select
  using (exists (select 1 from public.stock_transfers t where t.id = transfer_id
    and (public.has_store_access(t.from_store_id) or public.has_store_access(t.to_store_id))));
create policy transfer_items_write on public.stock_transfer_items for all
  using (exists (select 1 from public.stock_transfers t where t.id = transfer_id
    and (public.has_store_access(t.from_store_id) or public.has_store_access(t.to_store_id))));

-- ---------------------------------------------------------------------
-- INVENTAIRES PHYSIQUES
-- ---------------------------------------------------------------------
create policy stock_counts_select on public.stock_counts for select using (public.has_store_access(store_id));
create policy stock_counts_write on public.stock_counts for all
  using (public.has_permission(store_id, 'stock.manage'))
  with check (public.has_permission(store_id, 'stock.manage'));

create policy stock_count_items_select on public.stock_count_items for select
  using (exists (select 1 from public.stock_counts c where c.id = stock_count_id and public.has_store_access(c.store_id)));
create policy stock_count_items_write on public.stock_count_items for all
  using (exists (select 1 from public.stock_counts c where c.id = stock_count_id and public.has_permission(c.store_id, 'stock.manage')));

-- ---------------------------------------------------------------------
-- ACHATS
-- ---------------------------------------------------------------------
create policy po_select on public.purchase_orders for select using (public.has_store_access(store_id));
create policy po_write on public.purchase_orders for all
  using (public.has_permission(store_id, 'stock.manage'))
  with check (public.has_permission(store_id, 'stock.manage'));

create policy po_items_select on public.purchase_order_items for select
  using (exists (select 1 from public.purchase_orders po where po.id = purchase_order_id and public.has_store_access(po.store_id)));
create policy po_items_write on public.purchase_order_items for all
  using (exists (select 1 from public.purchase_orders po where po.id = purchase_order_id and public.has_permission(po.store_id, 'stock.manage')));

-- ---------------------------------------------------------------------
-- CAISSES / SESSIONS / MOUVEMENTS
-- ---------------------------------------------------------------------
create policy cash_registers_select on public.cash_registers for select using (public.has_store_access(store_id));
create policy cash_registers_write on public.cash_registers for all
  using (public.has_permission(store_id, 'cash.open')) with check (public.has_permission(store_id, 'cash.open'));

create policy cash_sessions_select on public.cash_sessions for select using (public.has_store_access(store_id));
create policy cash_sessions_insert on public.cash_sessions for insert
  with check (public.has_permission(store_id, 'cash.open'));
create policy cash_sessions_update on public.cash_sessions for update
  using (public.has_permission(store_id, 'cash.close') or opened_by = auth.uid());

create policy cash_movements_select on public.cash_movements for select
  using (exists (select 1 from public.cash_sessions cs where cs.id = cash_session_id and public.has_store_access(cs.store_id)));
create policy cash_movements_insert on public.cash_movements for insert
  with check (exists (select 1 from public.cash_sessions cs where cs.id = cash_session_id and public.has_store_access(cs.store_id)));

-- ---------------------------------------------------------------------
-- VENTES : un caissier voit les ventes de SA boutique ; ne peut pas
-- supprimer une vente validée (pas de policy delete = suppression bloquée)
-- ---------------------------------------------------------------------
create policy sales_select on public.sales for select using (public.has_store_access(store_id));
create policy sales_insert on public.sales for insert
  with check (public.has_permission(store_id, 'sales.create'));
create policy sales_update_cancel on public.sales for update
  using (public.has_permission(store_id, 'sales.cancel'));
-- Pas de policy DELETE : aucune vente ne peut être supprimée, même par owner (RGPD/traçabilité via RPC dédiée si besoin).

create policy sale_items_select on public.sale_items for select
  using (exists (select 1 from public.sales s where s.id = sale_id and public.has_store_access(s.store_id)));
create policy sale_items_insert on public.sale_items for insert
  with check (exists (select 1 from public.sales s where s.id = sale_id and public.has_permission(s.store_id, 'sales.create')));

create policy payments_select on public.payments for select
  using (exists (select 1 from public.sales s where s.id = sale_id and public.has_store_access(s.store_id)));
create policy payments_insert on public.payments for insert
  with check (exists (select 1 from public.sales s where s.id = sale_id and public.has_permission(s.store_id, 'sales.create')));

-- ---------------------------------------------------------------------
-- RETOURS
-- ---------------------------------------------------------------------
create policy returns_select on public.returns for select using (public.has_store_access(store_id));
create policy returns_insert on public.returns for insert
  with check (public.has_permission(store_id, 'returns.create'));

create policy return_items_select on public.return_items for select
  using (exists (select 1 from public.returns r where r.id = return_id and public.has_store_access(r.store_id)));
create policy return_items_insert on public.return_items for insert
  with check (exists (select 1 from public.returns r where r.id = return_id and public.has_permission(r.store_id, 'returns.create')));

-- ---------------------------------------------------------------------
-- DÉPENSES
-- ---------------------------------------------------------------------
create policy expense_categories_select on public.expense_categories for select using (auth.uid() is not null);
create policy expense_categories_write on public.expense_categories for all
  using (public.is_owner()) with check (public.is_owner());

create policy expenses_select on public.expenses for select using (public.has_store_access(store_id));
create policy expenses_write on public.expenses for all
  using (public.has_permission(store_id, 'expenses.create'))
  with check (public.has_permission(store_id, 'expenses.create'));

-- ---------------------------------------------------------------------
-- NOTIFICATIONS : chacun voit les siennes + celles de ses boutiques
-- ---------------------------------------------------------------------
create policy notifications_select on public.notifications for select
  using (user_id = auth.uid() or (store_id is not null and public.has_store_access(store_id)));
create policy notifications_update_read on public.notifications for update
  using (user_id = auth.uid() or public.is_owner());

-- ---------------------------------------------------------------------
-- AUDIT LOGS : lecture réservée owner/manager habilité ; AUCUNE écriture
-- directe autorisée pour un client (uniquement via triggers/RPC security definer)
-- Un caissier ne peut jamais lire ni modifier le journal d'audit.
-- ---------------------------------------------------------------------
create policy audit_logs_select on public.audit_logs for select
  using (public.is_owner() or (store_id is not null and public.has_permission(store_id, 'reports.view')));
-- Pas de policy insert/update/delete pour les rôles clients : uniquement service_role / SECURITY DEFINER.

-- ---------------------------------------------------------------------
-- SETTINGS
-- ---------------------------------------------------------------------
create policy settings_select on public.settings for select
  using (scope = 'global' or public.has_store_access(store_id));
create policy settings_write on public.settings for all
  using (public.is_owner() or (store_id is not null and public.has_permission(store_id, 'settings.manage')))
  with check (public.is_owner() or (store_id is not null and public.has_permission(store_id, 'settings.manage')));
