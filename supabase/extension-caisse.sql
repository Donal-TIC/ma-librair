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
