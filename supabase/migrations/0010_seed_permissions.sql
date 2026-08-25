-- =====================================================================
-- 0010_seed_permissions.sql — catalogue des permissions + matrice par défaut
-- =====================================================================

insert into public.permissions (key, label, category) values
  ('products.view',   'Voir les produits',        'Produits'),
  ('products.create', 'Créer des produits',       'Produits'),
  ('products.update', 'Modifier des produits',    'Produits'),
  ('products.delete', 'Supprimer des produits',   'Produits'),
  ('stock.view',      'Voir le stock',            'Stock'),
  ('stock.manage',    'Gérer le stock',           'Stock'),
  ('sales.view',      'Voir les ventes',          'Ventes'),
  ('sales.create',    'Enregistrer une vente',    'Ventes'),
  ('sales.cancel',    'Annuler une vente',        'Ventes'),
  ('returns.create',  'Effectuer un retour',      'Retours'),
  ('returns.view',    'Voir les retours',         'Retours'),
  ('cash.open',       'Ouvrir la caisse',         'Caisse'),
  ('cash.close',      'Clôturer la caisse',       'Caisse'),
  ('cash.view',       'Voir les caisses',         'Caisse'),
  ('users.create',    'Créer des utilisateurs',   'Utilisateurs'),
  ('users.update',    'Modifier des utilisateurs','Utilisateurs'),
  ('users.disable',   'Désactiver des utilisateurs', 'Utilisateurs'),
  ('stores.create',   'Créer des boutiques',      'Boutiques'),
  ('stores.update',   'Modifier des boutiques',   'Boutiques'),
  ('reports.view',    'Voir les rapports',        'Rapports'),
  ('expenses.create', 'Créer des dépenses',       'Dépenses'),
  ('settings.manage', 'Gérer les paramètres',     'Paramètres')
on conflict (key) do nothing;

-- Matrice par défaut. Le propriétaire (is_owner=true) contourne cette table
-- via public.is_owner() dans les policies RLS et a systématiquement accès à tout.

insert into public.role_permissions (role, permission_key) values
  -- MANAGER : quasi tout sauf gestion des boutiques/paramètres critiques
  ('manager','products.view'), ('manager','products.create'), ('manager','products.update'),
  ('manager','stock.view'), ('manager','stock.manage'),
  ('manager','sales.view'), ('manager','sales.create'), ('manager','sales.cancel'),
  ('manager','returns.create'), ('manager','returns.view'),
  ('manager','cash.open'), ('manager','cash.close'), ('manager','cash.view'),
  ('manager','users.create'), ('manager','users.update'), ('manager','users.disable'),
  ('manager','reports.view'), ('manager','expenses.create'),

  -- CASHIER : caisse et ventes uniquement
  ('cashier','products.view'), ('cashier','stock.view'),
  ('cashier','sales.view'), ('cashier','sales.create'),
  ('cashier','returns.create'), ('cashier','returns.view'),
  ('cashier','cash.open'), ('cashier','cash.close'), ('cashier','cash.view'),

  -- STOCK_MANAGER : produits + stock
  ('stock_manager','products.view'), ('stock_manager','products.update'),
  ('stock_manager','stock.view'), ('stock_manager','stock.manage'),

  -- ACCOUNTANT : lecture financière
  ('accountant','sales.view'), ('accountant','returns.view'), ('accountant','cash.view'),
  ('accountant','reports.view'), ('accountant','expenses.create'),

  -- SUPERVISOR : lecture large
  ('supervisor','products.view'), ('supervisor','stock.view'), ('supervisor','sales.view'),
  ('supervisor','returns.view'), ('supervisor','cash.view'), ('supervisor','reports.view')
on conflict do nothing;

insert into public.expense_categories (name) values
  ('Électricité'), ('Internet'), ('Transport'), ('Fournitures'),
  ('Salaires'), ('Entretien'), ('Loyer'), ('Autres')
on conflict (name) do nothing;
