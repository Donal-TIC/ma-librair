# Ma librair

Application de gestion pour librairie : stock, ventes, caisses, finances, code-barres, mode hors-ligne.

## Stack
- **Next.js 14** (React) — frontend, en PWA installable sur Android et iPhone
- **Supabase** — base de données Postgres + authentification + stockage
- **Vercel** — hébergement gratuit avec déploiement automatique
- **Dexie (IndexedDB)** — stockage local pour le mode hors-ligne

## État actuel (fondations posées)
- ✅ Structure du projet Next.js
- ✅ Schéma complet de base de données (`supabase/schema.sql`) avec sécurité par boutique (RLS)
- ✅ Page de connexion + redirection selon le rôle (admin / caissier)
- ✅ Squelette espace admin (tableau de bord)
- ✅ Squelette espace caisse (vente + dépenses) avec sauvegarde locale hors-ligne
- ✅ Génération de code-barres (composant `BarcodeImage`)
- ⬜ Pages détaillées : gestion des articles, mouvements de stock, finances complètes, gestion des boutiques/caissiers — **prochaines étapes**

## 1. Mettre en place Supabase (gratuit)
1. Créez un compte sur https://supabase.com et un nouveau projet.
2. Allez dans **SQL Editor**, copiez-collez le contenu de `supabase/schema.sql` et exécutez-le. Cela crée toutes les tables, la sécurité et les automatismes (ex : le stock qui se décrémente automatiquement après une vente).
3. Allez dans **Authentication > Providers**, activez "Email".
4. Créez votre premier compte admin dans **Authentication > Users > Add user**, puis ajoutez une ligne correspondante dans la table `profils` avec `role = 'admin'`.
5. Récupérez votre URL et clé "anon" dans **Project Settings > API**.

## 2. Configurer le projet en local
```bash
cp .env.local.example .env.local
# Remplissez .env.local avec vos clés Supabase
npm install
npm run dev
```
Ouvrez http://localhost:3000

## 3. Mettre le code sur GitHub
```bash
git init
git add .
git commit -m "Fondations de Ma librair"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/ma-librair.git
git push -u origin main
```

## 4. Déployer sur Vercel (gratuit)
1. Créez un compte sur https://vercel.com (connectez-le à votre GitHub).
2. "Add New Project" → sélectionnez le dépôt `ma-librair`.
3. Dans les paramètres du projet, ajoutez les variables d'environnement `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` (les mêmes que dans `.env.local`).
4. Cliquez sur "Deploy". Vercel vous donne une URL publique (ex : `ma-librair.vercel.app`), accessible partout, gratuitement.

## 5. Installer l'application sur téléphone
- **Android (Chrome)** : ouvrez l'URL Vercel → menu ⋮ → "Ajouter à l'écran d'accueil".
- **iPhone (Safari)** : ouvrez l'URL Vercel → bouton Partager → "Sur l'écran d'accueil".

Cela installe "Ma librair" comme une vraie application, avec icône, sans passer par l'App Store/Play Store. Le mode hors-ligne fonctionne grâce au service worker (PWA) : les ventes et dépenses saisies sans connexion sont sauvegardées localement puis synchronisées automatiquement dès le retour d'internet.

⚠️ Pour une publication officielle sur l'App Store / Play Store (facultatif), il faudrait empaqueter cette PWA avec un outil comme Capacitor, ce qui nécessite un compte développeur Apple (payant) et Google (payant, une fois).

## Icônes de l'application
Ajoutez vos icônes (192×192 et 512×512 px) dans `public/icons/` sous les noms `icon-192.png` et `icon-512.png`.

## Sécurité
Toutes les mesures de sécurité mises en place (protection des données, aucune information sensible dans le code, en-têtes HTTP, etc.) sont détaillées dans **`SECURITY.md`**. À lire avant la mise en production, notamment les 4 réglages à activer manuellement dans le tableau de bord Supabase.

## Prochaines étapes de développement
1. Gestion complète des articles (création, modification, code-barre auto, upload photo)
2. Page mouvements de stock (historique entrées/sorties avec filtres)
3. Gestion des boutiques et des comptes caissiers par l'admin
4. Module finances (bénéfices, dépenses, pertes, budget, graphiques)
5. Scan caméra du code-barre (html5-qrcode) en caisse
6. Génération de reçu imprimable au format ticket de caisse
