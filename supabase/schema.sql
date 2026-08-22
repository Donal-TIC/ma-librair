-- =========================================================
-- MA LIBRAIR — Schéma de base de données Supabase (Postgres)
-- =========================================================
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- Ordre : extensions -> types -> tables -> index -> RLS -> triggers

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- TYPES
-- ---------------------------------------------------------
create type user_role as enum ('admin', 'caissier');
create type mouvement_type as enum ('entree', 'sortie', 'vente', 'perte', 'correction', 'retour');
create type depense_statut as enum ('validee', 'en_attente');

-- ---------------------------------------------------------
-- BOUTIQUES (librairies gérées par l'administrateur)
-- ---------------------------------------------------------
create table boutiques (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  adresse text,
  telephone text,
  budget_initial numeric(12,2) default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  actif boolean default true
);

-- ---------------------------------------------------------
-- PROFILS UTILISATEURS (lié à auth.users de Supabase)
-- ---------------------------------------------------------
create table profils (
  id uuid primary key references auth.users(id) on delete cascade,
  nom_complet text not null,
  role user_role not null default 'caissier',
  boutique_id uuid references boutiques(id),
  actif boolean default true,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- CATÉGORIES D'ARTICLES
-- ---------------------------------------------------------
create table categories (
  id uuid primary key default uuid_generate_v4(),
  boutique_id uuid references boutiques(id) not null,
  nom text not null,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- FOURNISSEURS
-- ---------------------------------------------------------
create table fournisseurs (
  id uuid primary key default uuid_generate_v4(),
  boutique_id uuid references boutiques(id) not null,
  nom text not null,
  telephone text,
  adresse text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- ARTICLES (chaque article a un code-barre unique généré)
-- ---------------------------------------------------------
create table articles (
  id uuid primary key default uuid_generate_v4(),
  boutique_id uuid references boutiques(id) not null,
  categorie_id uuid references categories(id),
  fournisseur_id uuid references fournisseurs(id),
  code_barre text unique not null,          -- généré automatiquement (ex: LIB-000123)
  nom text not null,
  description text,
  prix_achat numeric(12,2) not null default 0,
  prix_vente numeric(12,2) not null default 0,
  quantite_stock integer not null default 0,
  seuil_alerte integer not null default 5,   -- alerte stock bas
  image_url text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  actif boolean default true
);

-- Séquence pour générer les numéros de code-barre par boutique
create sequence if not exists article_code_seq;

-- ---------------------------------------------------------
-- MOUVEMENTS DE STOCK (traçabilité entrées/sorties)
-- ---------------------------------------------------------
create table mouvements_stock (
  id uuid primary key default uuid_generate_v4(),
  boutique_id uuid references boutiques(id) not null,
  article_id uuid references articles(id) not null,
  type mouvement_type not null,
  quantite integer not null,
  quantite_avant integer not null,
  quantite_apres integer not null,
  motif text,
  effectue_par uuid references auth.users(id),
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- VENTES (une vente = un ticket de caisse)
-- ---------------------------------------------------------
create table ventes (
  id uuid primary key default uuid_generate_v4(),
  boutique_id uuid references boutiques(id) not null,
  numero_recu text not null,                 -- numéro affiché sur le reçu
  caissier_id uuid references auth.users(id) not null,
  montant_total numeric(12,2) not null default 0,
  montant_paye numeric(12,2) not null default 0,
  monnaie_rendue numeric(12,2) not null default 0,
  mode_paiement text default 'especes',
  created_at timestamptz default now(),
  synced boolean default true                 -- utile pour la synchro hors-ligne
);

-- ---------------------------------------------------------
-- LIGNES DE VENTE (détail des articles vendus)
-- ---------------------------------------------------------
create table lignes_vente (
  id uuid primary key default uuid_generate_v4(),
  vente_id uuid references ventes(id) on delete cascade not null,
  article_id uuid references articles(id) not null,
  nom_article text not null,        -- copie du nom au moment de la vente
  prix_unitaire numeric(12,2) not null,
  quantite integer not null,
  sous_total numeric(12,2) not null,
  est_gros boolean default false,          -- vente en gros (prix négocié)
  prix_reference numeric(12,2),            -- prix de vente catalogue au moment de la vente
  prix_achat_reference numeric(12,2)       -- prix d'achat catalogue au moment de la vente (pour calcul du bénéfice)
);

-- ---------------------------------------------------------
-- DÉPENSES (saisies par la caisse ou l'admin)
-- ---------------------------------------------------------
create table depenses (
  id uuid primary key default uuid_generate_v4(),
  boutique_id uuid references boutiques(id) not null,
  motif text not null,
  montant numeric(12,2) not null,
  statut depense_statut default 'validee',
  effectue_par uuid references auth.users(id),
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- JOURNAL D'AUDIT (qui a fait quoi — traçabilité générale)
-- ---------------------------------------------------------
create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  boutique_id uuid references boutiques(id),
  utilisateur_id uuid references auth.users(id),
  action text not null,
  details jsonb,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- INDEX (performance)
-- ---------------------------------------------------------
create index idx_articles_boutique on articles(boutique_id);
create index idx_articles_code_barre on articles(code_barre);
create index idx_mouvements_article on mouvements_stock(article_id);
create index idx_mouvements_boutique on mouvements_stock(boutique_id);
create index idx_ventes_boutique on ventes(boutique_id);
create index idx_ventes_date on ventes(created_at);
create index idx_depenses_boutique on depenses(boutique_id);
create index idx_lignes_vente_vente on lignes_vente(vente_id);

-- ---------------------------------------------------------
-- FONCTION : mise à jour automatique du stock après une vente
-- ---------------------------------------------------------
create or replace function decrementer_stock()
returns trigger as $$
begin
  update articles
  set quantite_stock = quantite_stock - new.quantite,
      updated_at = now()
  where id = new.article_id;

  insert into mouvements_stock (boutique_id, article_id, type, quantite, quantite_avant, quantite_apres, motif, effectue_par)
  select v.boutique_id, new.article_id, 'vente', new.quantite,
         a.quantite_stock + new.quantite, a.quantite_stock, 'Vente ' || v.numero_recu, v.caissier_id
  from ventes v, articles a
  where v.id = new.vente_id and a.id = new.article_id;

  return new;
end;
$$ language plpgsql;

create trigger trg_decrementer_stock
after insert on lignes_vente
for each row execute function decrementer_stock();

-- ---------------------------------------------------------
-- ROW LEVEL SECURITY (chaque utilisateur ne voit que sa boutique,
-- sauf l'admin qui gère tout ce qu'il a créé)
-- ---------------------------------------------------------
alter table boutiques enable row level security;
alter table profils enable row level security;
alter table categories enable row level security;
alter table fournisseurs enable row level security;
alter table articles enable row level security;
alter table mouvements_stock enable row level security;
alter table ventes enable row level security;
alter table lignes_vente enable row level security;
alter table depenses enable row level security;
alter table audit_log enable row level security;

-- Fonction utilitaire : récupère le rôle et la boutique de l'utilisateur connecté
create or replace function current_user_boutique() returns uuid as $$
  select boutique_id from profils where id = auth.uid();
$$ language sql stable;

create or replace function current_user_role() returns user_role as $$
  select role from profils where id = auth.uid();
$$ language sql stable;

-- Profils : chacun voit son propre profil, l'admin voit tous les profils de ses boutiques
create policy "profils_select" on profils for select
  using (id = auth.uid() or boutique_id in (select id from boutiques where created_by = auth.uid()));

-- Boutiques : l'admin voit/gère les boutiques qu'il a créées, le caissier voit la sienne
create policy "boutiques_select" on boutiques for select
  using (created_by = auth.uid() or id = current_user_boutique());
create policy "boutiques_insert" on boutiques for insert
  with check (created_by = auth.uid());
create policy "boutiques_update" on boutiques for update
  using (created_by = auth.uid());

-- Règle générique appliquée à toutes les tables métier : accès limité à sa boutique
create policy "articles_all" on articles for all
  using (boutique_id = current_user_boutique() or boutique_id in (select id from boutiques where created_by = auth.uid()));

create policy "categories_all" on categories for all
  using (boutique_id = current_user_boutique() or boutique_id in (select id from boutiques where created_by = auth.uid()));

create policy "fournisseurs_all" on fournisseurs for all
  using (boutique_id = current_user_boutique() or boutique_id in (select id from boutiques where created_by = auth.uid()));

create policy "mouvements_all" on mouvements_stock for all
  using (boutique_id = current_user_boutique() or boutique_id in (select id from boutiques where created_by = auth.uid()));

create policy "ventes_all" on ventes for all
  using (boutique_id = current_user_boutique() or boutique_id in (select id from boutiques where created_by = auth.uid()));

create policy "lignes_vente_all" on lignes_vente for all
  using (vente_id in (select id from ventes));

create policy "depenses_all" on depenses for all
  using (boutique_id = current_user_boutique() or boutique_id in (select id from boutiques where created_by = auth.uid()));

create policy "audit_select" on audit_log for select
  using (boutique_id in (select id from boutiques where created_by = auth.uid()));

-- Seul le serveur (via une fonction sécurisée) peut écrire dans le journal d'audit,
-- jamais directement depuis le client : aucune policy INSERT n'est créée pour audit_log
-- côté utilisateurs authentifiés -> écriture uniquement via la fonction ci-dessous.

-- ---------------------------------------------------------
-- DURCISSEMENT SÉCURITÉ
-- ---------------------------------------------------------

-- 1) Refus par défaut : toute table sans policy explicite est inaccessible
--    (comportement par défaut de Postgres RLS, on le rend explicite ici)
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on
  boutiques, profils, categories, fournisseurs, articles,
  mouvements_stock, ventes, lignes_vente, depenses
  to authenticated;
grant select on audit_log to authenticated;

-- 2) Un caissier ne doit jamais pouvoir modifier son propre rôle ou changer
--    de boutique lui-même (seul l'admin gère les comptes) : on bloque l'update
--    du champ "role" et "boutique_id" côté profils pour tout sauf l'admin.
create or replace function empecher_auto_promotion()
returns trigger as $$
begin
  if current_user_role() <> 'admin' and (new.role <> old.role or new.boutique_id is distinct from old.boutique_id) then
    raise exception 'Modification non autorisée : seul un administrateur peut changer un rôle ou une boutique.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_empecher_auto_promotion
before update on profils
for each row execute function empecher_auto_promotion();

-- 3) Fonction sécurisée pour générer un code-barre unique côté serveur
--    (jamais côté client, pour éviter les doublons/manipulations)
create or replace function generer_code_barre_article()
returns text as $$
declare
  nouveau_numero bigint;
begin
  nouveau_numero := nextval('article_code_seq');
  return 'LIB-' || lpad(nouveau_numero::text, 6, '0');
end;
$$ language plpgsql security definer;

-- 4) Journalisation automatique des actions sensibles (audit_log rempli par le
--    serveur, jamais falsifiable depuis le client)
create or replace function journaliser_action()
returns trigger as $$
begin
  insert into audit_log (boutique_id, utilisateur_id, action, details)
  values (
    coalesce(new.boutique_id, old.boutique_id),
    auth.uid(),
    tg_op || ' sur ' || tg_table_name,
    to_jsonb(coalesce(new, old))
  );
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger trg_audit_articles after insert or update or delete on articles
  for each row execute function journaliser_action();
create trigger trg_audit_ventes after insert on ventes
  for each row execute function journaliser_action();
create trigger trg_audit_depenses after insert or update on depenses
  for each row execute function journaliser_action();
create trigger trg_audit_mouvements after insert on mouvements_stock
  for each row execute function journaliser_action();

-- Alerte automatique si une vente en gros fait tomber le bénéfice sous 10% du
-- bénéfice normalement attendu sur l'article (et non 10% du prix brut) :
-- consignée dans le journal d'audit pour supervision par l'admin.
create or replace function surveiller_remise_gros()
returns trigger as $$
declare
  benefice_normal numeric;
  benefice_applique numeric;
begin
  if new.est_gros and new.prix_reference is not null and new.prix_achat_reference is not null then
    benefice_normal := new.prix_reference - new.prix_achat_reference;
    benefice_applique := new.prix_unitaire - new.prix_achat_reference;

    if benefice_normal > 0 and benefice_applique < benefice_normal * 0.1 then
      insert into audit_log (boutique_id, utilisateur_id, action, details)
      select v.boutique_id, v.caissier_id, 'Bénéfice gros < 10% du bénéfice attendu',
             jsonb_build_object(
               'article', new.nom_article,
               'prix_vente_reference', new.prix_reference,
               'prix_achat_reference', new.prix_achat_reference,
               'prix_applique', new.prix_unitaire,
               'benefice_normal', benefice_normal,
               'benefice_applique', benefice_applique,
               'vente_id', new.vente_id
             )
      from ventes v where v.id = new.vente_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_surveiller_remise_gros after insert on lignes_vente
  for each row execute function surveiller_remise_gros();
