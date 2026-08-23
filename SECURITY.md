# Sécurité — Ma librair

## Aucune information sensible dans le code source
- Les clés Supabase ne sont **jamais écrites en dur** dans le code : elles vivent uniquement dans `.env.local` (en local) et dans les variables d'environnement Vercel (en production).
- `.env.local` est exclu de Git via `.gitignore` — il ne sera **jamais poussé sur GitHub**.
- Seule la clé "anon" de Supabase est utilisée côté application. Cette clé est *conçue pour être publique* : ce qui protège réellement les données, ce sont les règles RLS (Row Level Security) côté base de données, pas le secret de la clé.
- ⚠️ La clé **`service_role`** de Supabase (accès total, qui contourne la sécurité) est utilisée **uniquement côté serveur**, dans `src/app/admin/boutiques/actions.ts`, pour permettre à l'administrateur de créer des comptes caissiers. Elle est stockée sous le nom `SUPABASE_SERVICE_ROLE_KEY` (jamais préfixée par `NEXT_PUBLIC_`, donc jamais envoyée au navigateur) et doit être marquée "Sensitive" dans les variables d'environnement Vercel.

## Protection de la base de données
- **Row Level Security (RLS) activée sur toutes les tables** : chaque utilisateur ne peut lire/écrire que les données de sa propre boutique.
- **Refus par défaut** : une table sans policy explicite est totalement inaccessible (pas d'oubli possible).
- Le rôle `anon` (visiteur non connecté) n'a **aucun accès** aux données métier — seul un utilisateur authentifié (`authenticated`) en a, et uniquement filtré par boutique.
- Un caissier ne peut **pas** modifier son propre rôle ou changer de boutique (bloqué par un trigger serveur) — seul l'administrateur gère les comptes.
- Le code-barre de chaque article est généré **côté serveur** (fonction Postgres sécurisée), jamais côté client, pour empêcher les doublons ou manipulations.
- Toute action sensible (création/modification d'article, vente, dépense, mouvement de stock) est **journalisée automatiquement** dans `audit_log`, de façon infalsifiable depuis le client.

## Protection de l'application web
- En-têtes de sécurité HTTP activés sur toutes les pages (`next.config.js`) : anti-clickjacking, anti-sniffing MIME, Content-Security-Policy, HSTS (force le HTTPS).
- HTTPS automatique et forcé par Vercel.
- En-tête technique `X-Powered-By` masqué (moins d'informations données à un attaquant).
- Authentification gérée entièrement par Supabase Auth (mots de passe hashés, jamais stockés en clair).

## À activer manuellement dans le tableau de bord Supabase (5 min)
1. **Authentication > Providers > Email** : désactivez "Enable email signups" si vous ne voulez pas que n'importe qui puisse créer un compte — les comptes admin/caissier doivent être créés uniquement par vous.
2. **Authentication > Policies** : activez "Leaked password protection" (bloque les mots de passe déjà compromis publiquement).
3. **Authentication > Rate Limits** : Supabase limite déjà nativement les tentatives de connexion répétées (anti brute-force) — vérifiez que c'est actif.
4. **Database > Backups** : sur le plan gratuit, pensez à exporter régulièrement un backup manuel (Database > Backups > Download), ou passez sur un plan payant pour les sauvegardes automatiques quotidiennes.

## Bonnes pratiques à respecter en continu
- Ne jamais committer de fichier `.env*` (le `.gitignore` le bloque déjà).
- Ne jamais coller une clé Supabase, un mot de passe ou un token dans un message de commit, un README ou un fichier du dépôt.
- Changer les mots de passe des comptes admin régulièrement.
- Limiter le nombre de comptes admin au strict nécessaire.
