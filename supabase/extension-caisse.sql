-- =========================================================
-- MA LIBRAIR — Extension caisse professionnelle
-- =========================================================
-- À exécuter APRÈS schema.sql, dans Supabase > SQL Editor.
-- Ajoute : sessions de caisse, clients, paiements multiples, retours,
-- infos livre (auteur/ISBN), et sécurise le tout avec RLS.

-- ---------------------------------------------------------
-- CLIENTS
-- ---------------------------------------------------------
create table clients (
  id uuid primary key default uuid_generate_v4(),
  boutique_id uuid references boutiques(id) not null,
  nom text not null,
  telephone text,
  email text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- SESSIONS DE CAISSE (ouverture / fermeture avec comptage)
-- ---------------------------------------------------------
create table sessions_caisse (
  id uuid primary key default uuid_generate_v4(),
  boutique_id uuid references boutiques(id) not null,
  caissier_id uuid references auth.users(id) not null,
  fond_initial numeric(12,2) not null default 0,
  montant_theorique numeric(12,2),
  montant_compte numeric(12,2),
  ecart numeric(12,2),
  ouverte_at timestamptz default now(),
  fermee_at timestamptz,
  statut text not null default 'ouverte' check (statut in ('ouverte', 'fermee'))
);

-- Mouvements d'argent en cours de session (hors ventes) : apport, retrait...
create table mouvements_caisse (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions_caisse(id) not null,
  type text not null check (type in ('entree', 'sortie')),
  montant numeric(12,2) not null,
  motif text not null,
  effectue_par uuid references auth.users(id),
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- LIENS VENTE <-> SESSION / CLIENT + PAIEMENTS MULTIPLES
-- ---------------------------------------------------------
alter table ventes add column if not exists session_id uuid references sessions_caisse(id);
alter table ventes add column if not exists client_id uuid references clients(id);
alter table ventes add column if not exists annulee boolean default false;

create table paiements_vente (
  id uuid primary key default uuid_generate_v4(),
  vente_id uuid references ventes(id) on delete cascade not null,
  mode text not null check (mode in ('especes', 'carte', 'mobile_money')),
  montant numeric(12,2) not null
);

-- ---------------------------------------------------------
-- RETOURS / REMBOURSEMENTS
-- ---------------------------------------------------------
create table retours (
  id uuid primary key default uuid_generate_v4(),
  vente_id uuid references ventes(id) not null,
  ligne_vente_id uuid references lignes_vente(id) not null,
  boutique_id uuid references boutiques(id) not null,
  quantite integer not null,
  motif text not null,
  montant_rembourse numeric(12,2) not null,
  effectue_par uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Un retour remet la quantité en stock automatiquement
create or replace function traiter_retour()
returns trigger as $$
begin
  update articles
  set quantite_stock = quantite_stock + new.quantite,
      updated_at = now()
  where id = (select article_id from lignes_vente where id = new.ligne_vente_id);

  insert into mouvements_stock (boutique_id, article_id, type, quantite, quantite_avant, quantite_apres, motif, effectue_par)
  select new.boutique_id, lv.article_id, 'retour', new.quantite,
         a.quantite_stock, a.quantite_stock + new.quantite,
         'Retour : ' || new.motif, new.effectue_par
  from lignes_vente lv, articles a
  where lv.id = new.ligne_vente_id and a.id = lv.article_id;

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_traiter_retour after insert on retours
  for each row execute function traiter_retour();

-- ---------------------------------------------------------
-- INFOS LIVRE COMPLÉMENTAIRES
-- ---------------------------------------------------------
alter table articles add column if not exists auteur text;
alter table articles add column if not exists isbn text;
alter table articles add column if not exists prix_gros numeric(12,2);
alter table articles add column if not exists quantite_min_gros integer default 1;

-- Compléments à la table fournisseurs (créée dans schema.sql avec nom/telephone/adresse seulement)
alter table fournisseurs add column if not exists personne_contact text;
alter table fournisseurs add column if not exists conditions_paiement text;
alter table fournisseurs add column if not exists notes text;
alter table fournisseurs add column if not exists actif boolean default true;

-- ---------------------------------------------------------
-- ACHATS FOURNISSEURS
-- ---------------------------------------------------------
create table achats (
  id uuid primary key default uuid_generate_v4(),
  numero text not null unique,
  fournisseur_id uuid references fournisseurs(id) not null,
  boutique_id uuid references boutiques(id) not null,
  statut text not null default 'commandee' check (statut in ('brouillon', 'commandee', 'partiellement_recue', 'recue', 'annulee')),
  montant_total numeric(12,2) not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table achats_lignes (
  id uuid primary key default uuid_generate_v4(),
  achat_id uuid references achats(id) on delete cascade not null,
  article_id uuid references articles(id) not null,
  nom_article text not null,
  quantite_commandee integer not null,
  quantite_recue integer not null default 0,
  prix_achat_unitaire numeric(12,2) not null
);

create table retours_fournisseurs (
  id uuid primary key default uuid_generate_v4(),
  achat_id uuid references achats(id) not null,
  boutique_id uuid references boutiques(id) not null,
  article_id uuid references articles(id) not null,
  nom_article text not null,
  quantite integer not null,
  motif text not null,
  effectue_par uuid references auth.users(id),
  created_at timestamptz default now()
);

create sequence if not exists achat_numero_seq;
create or replace function generer_numero_achat()
returns text as $$
begin
  return 'ACH-' || extract(year from now()) || '-' || lpad(nextval('achat_numero_seq')::text, 6, '0');
end;
$$ language plpgsql security definer;

alter table achats enable row level security;
alter table achats_lignes enable row level security;
alter table retours_fournisseurs enable row level security;

create policy "achats_all" on achats for all
  using (boutique_id = current_user_boutique() or boutique_id in (select id from boutiques where created_by = auth.uid()));
create policy "achats_lignes_all" on achats_lignes for all
  using (achat_id in (select id from achats));
create policy "retours_fournisseurs_all" on retours_fournisseurs for all
  using (boutique_id = current_user_boutique() or boutique_id in (select id from boutiques where created_by = auth.uid()));

create index idx_achats_boutique on achats(boutique_id);
create index idx_achats_fournisseur on achats(fournisseur_id);

-- ---------------------------------------------------------
-- TRANSFERTS ENTRE BOUTIQUES
-- ---------------------------------------------------------
create table transferts (
  id uuid primary key default uuid_generate_v4(),
  numero text not null unique,
  boutique_source_id uuid references boutiques(id) not null,
  boutique_destination_id uuid references boutiques(id) not null,
  statut text not null default 'expedie' check (statut in ('expedie', 'partiellement_recu', 'recu', 'annule')),
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  recu_at timestamptz,
  check (boutique_source_id <> boutique_destination_id)
);

create table transferts_lignes (
  id uuid primary key default uuid_generate_v4(),
  transfert_id uuid references transferts(id) on delete cascade not null,
  article_id uuid references articles(id) not null,
  nom_article text not null,
  quantite_envoyee integer not null,
  quantite_recue integer
);

create sequence if not exists transfert_numero_seq;
create or replace function generer_numero_transfert()
returns text as $$
begin
  return 'TRF-' || extract(year from now()) || '-' || lpad(nextval('transfert_numero_seq')::text, 6, '0');
end;
$$ language plpgsql security definer;

alter table transferts enable row level security;
alter table transferts_lignes enable row level security;

create policy "transferts_all" on transferts for all
  using (
    boutique_source_id in (select id from boutiques where created_by = auth.uid())
    or boutique_destination_id in (select id from boutiques where created_by = auth.uid())
  );

create policy "transferts_lignes_all" on transferts_lignes for all
  using (transfert_id in (select id from transferts));

create index idx_transferts_source on transferts(boutique_source_id);
create index idx_transferts_destination on transferts(boutique_destination_id);

-- ---------------------------------------------------------
-- INVENTAIRES
-- ---------------------------------------------------------
create table inventaires (
  id uuid primary key default uuid_generate_v4(),
  numero text not null unique,
  boutique_id uuid references boutiques(id) not null,
  statut text not null default 'en_cours' check (statut in ('en_cours', 'termine')),
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  termine_at timestamptz
);

create table inventaires_lignes (
  id uuid primary key default uuid_generate_v4(),
  inventaire_id uuid references inventaires(id) on delete cascade not null,
  article_id uuid references articles(id) not null,
  nom_article text not null,
  stock_theorique integer not null,
  stock_compte integer,
  ecart integer,
  justification text
);

create sequence if not exists inventaire_numero_seq;
create or replace function generer_numero_inventaire()
returns text as $$
begin
  return 'INV-' || extract(year from now()) || '-' || lpad(nextval('inventaire_numero_seq')::text, 6, '0');
end;
$$ language plpgsql security definer;

alter table inventaires enable row level security;
alter table inventaires_lignes enable row level security;

create policy "inventaires_all" on inventaires for all
  using (boutique_id = current_user_boutique() or boutique_id in (select id from boutiques where created_by = auth.uid()));

create policy "inventaires_lignes_all" on inventaires_lignes for all
  using (inventaire_id in (select id from inventaires));

create index idx_inventaires_boutique on inventaires(boutique_id);

-- ---------------------------------------------------------
-- SÉCURITÉ (RLS) SUR LES NOUVELLES TABLES
-- ---------------------------------------------------------
alter table clients enable row level security;
alter table sessions_caisse enable row level security;
alter table mouvements_caisse enable row level security;
alter table paiements_vente enable row level security;
alter table retours enable row level security;

create policy "clients_all" on clients for all
  using (boutique_id = current_user_boutique() or boutique_id in (select id from boutiques where created_by = auth.uid()));

create policy "sessions_caisse_all" on sessions_caisse for all
  using (boutique_id = current_user_boutique() or boutique_id in (select id from boutiques where created_by = auth.uid()));

create policy "mouvements_caisse_all" on mouvements_caisse for all
  using (session_id in (select id from sessions_caisse));

create policy "paiements_vente_all" on paiements_vente for all
  using (vente_id in (select id from ventes));

create policy "retours_all" on retours for all
  using (boutique_id = current_user_boutique() or boutique_id in (select id from boutiques where created_by = auth.uid()));

create index idx_sessions_caisse_caissier on sessions_caisse(caissier_id, statut);
create index idx_ventes_session on ventes(session_id);
create index idx_clients_boutique on clients(boutique_id);
