# La librairie de Katiola

Application de gestion de librairie multi-boutiques, multi-utilisateurs — caisse (POS), stock, achats, ventes, retours, dépenses, rapports. Construite sur Next.js (App Router) + TypeScript + Supabase + Tailwind CSS, installable en PWA.

## ⚠️ État du projet — à lire avant de démarrer

Ce dépôt a été généré à partir du cahier des charges complet fourni. Le **socle est réellement fonctionnel et connecté à Supabase** (pas de données statiques ni de faux JSON) :

**Implémenté et fonctionnel :**
- Schéma Supabase complet (migrations `0001` → `0010`) : profils, rôles, permissions, boutiques multi-tenant, catalogue produits, stock par boutique, achats, caisses/sessions, **ventes atomiques via transaction Postgres**, retours avec contrôle anti-abus, dépenses, notifications, audit, paramètres
- RLS activé et strict sur **toutes** les tables sensibles — testé pour qu'un caissier ne puisse jamais accéder aux données d'une autre boutique ni contourner ses permissions, même en appelant Supabase directement
- Authentification Supabase Auth, deux parcours de connexion (Responsable / Caissier), protection de routes via middleware + vérification serveur
- Page d'accueil, connexion, dashboard Responsable avec KPIs réels, module Produits (liste + recherche + pagination, création/édition/archivage via Server Actions vérifiées par permission)
- **Caisse (POS) fonctionnelle de bout en bout** : ouverture de caisse, recherche produit, panier, encaissement via la fonction SQL `create_sale` (vente + lignes + paiement + déduction de stock dans une seule transaction), clôture de caisse avec calcul d'écart, reçu imprimable au format 80 mm
- **Boutiques** : création, édition, activation/désactivation, KPIs par boutique (CA du mois, effectif, réf. en stock) — réservé au propriétaire
- **Utilisateurs** : création de compte (Supabase Auth + profil + attribution boutique/rôle en une opération atomique côté serveur), désactivation/réactivation. Un utilisateur désactivé est déconnecté et bloqué dès sa prochaine requête (vérifié dans les deux layouts, pas seulement à la connexion)
- PWA (manifest, service worker via `next-pwa`)

**Structuré mais à compléter** (le schéma, les policies RLS et les Server Actions existent déjà pour ces modules — il reste l'interface) :
- Transferts entre boutiques, Inventaire physique, Achats (interface de réception), Retours (interface), Clients, Rapports/graphiques (recharts), Centre de notifications, Journal d'audit (lecture), Import/export CSV, mode sombre (tokens déjà en place dans `globals.css`), édition fine des permissions par rôle (la matrice par défaut est en base, l'écran de configuration reste à faire)

Voir la section **Prochaines étapes** en bas de ce document pour l'ordre recommandé.

## Stack technique

Next.js 14 (App Router) · TypeScript strict · Tailwind CSS · Supabase (Postgres, Auth, Storage, Realtime, RLS) · React Hook Form + Zod · TanStack Query · next-pwa

## Installation

```bash
npm install
cp .env.example .env.local
# renseignez NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
```

### Connexion à votre projet Supabase existant

```bash
npx supabase login
npx supabase link --project-ref <votre-project-ref>
npx supabase db push          # applique les migrations supabase/migrations/*.sql
npx supabase db execute -f supabase/seed.sql   # données de démo optionnelles
npm run db:types              # régénère types/database.types.ts depuis le schéma réel
```

### Créer le premier propriétaire (owner)

Supabase Auth ne peut pas être seedé de façon fiable en SQL pur. Après `npm run dev` :

1. Créez un compte via `supabase.auth.admin.createUser()` (script `scripts/create-owner.ts` fourni, à lancer avec `SUPABASE_SERVICE_ROLE_KEY` en variable d'environnement locale uniquement) ou depuis le dashboard Supabase (Authentication > Users > Add user).
2. Passez ensuite `profiles.is_owner = true` pour cet utilisateur (SQL editor Supabase) :
   ```sql
   update public.profiles set is_owner = true where email = 'votre-email@exemple.com';
   ```
3. Connectez-vous sur `/login/responsable`.

### Lancer en local

```bash
npm run dev
```

## Sécurité — principes appliqués

- **RLS toujours actif** : aucune table sensible n'est accessible sans policy explicite (voir `0009_rls_policies.sql`). Le frontend ne fait jamais office de mécanisme de sécurité — chaque Server Action rappelle `assertPermission()` qui interroge la même fonction SQL que RLS (`has_permission`), donc aucune divergence possible.
- **Clé service role** : jamais importée hors de `lib/supabase/admin.ts`, protégée par le package `server-only`.
- **Transactions atomiques** : la création d'une vente (`create_sale`), la réception d'achat et le retour sont des fonctions Postgres `SECURITY DEFINER` exécutées en une seule transaction — pas d'état incohérent possible entre vente, stock et paiement.
- **Aucune suppression physique** de vente, produit ou boutique — suppression logique (`is_active`, `deleted_at`) uniquement.

## Déploiement

**Vercel** : connectez le dépôt GitHub, renseignez les 3 variables d'environnement du `.env.example` dans les Project Settings, déployez. Le build Next.js standard s'applique (`next build`).

**Ne jamais committer** `.env` / `.env.local`.

## Tests

```bash
npm run test
```
Les tests couvrent en priorité : permissions RLS (via clients Supabase de test avec des JWT différents), calcul de vente/stock, clôture de caisse. À étoffer au fur et à mesure (voir dossier `tests/`).

## Prochaines étapes recommandées

1. ~~Interface Boutiques + Utilisateurs~~ ✅ fait
2. Interface Achats (réception, appelle `receive_purchase_order_item`)
3. Interface Retours (appelle `create_return`)
4. Rapports + graphiques (`recharts`, tables `sales`/`sale_items` déjà indexées pour ça)
5. Centre de notifications (table + trigger d'alerte stock déjà actifs, il manque l'UI de lecture)
6. Tests automatisés étendus + CI GitHub Actions
