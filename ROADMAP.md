# Feuille de route — Ma librair

Basée sur le cahier des charges complet (72 sections) fourni le 23/08/2026.
Construite par phases pour garder une qualité fiable à chaque étape.

## ✅ Déjà construit
- Authentification admin/caissier séparée, rôles, permissions de base
- Boutiques (création, modification, activation), caissiers rattachés à une boutique précise
- Articles avec code-barre auto, catégories, fournisseurs, prix de gros minimum avec seuil de quantité
- Stock : mouvements tracés (entrée/sortie/vente/perte/correction/retour), alertes stock bas
- Ventes / POS : scan, panier, vente en gros avec plancher de prix, paiement multiple (espèces/carte/mobile money)
- Clients : recherche, création, historique d'achats
- Retours clients (remise en stock automatique)
- Gestion de caisse : ouverture, fermeture, comptage, écart théorique/réel
- Finances admin : CA, bénéfice, dépenses, pertes, budget, graphique, filtrable par période/boutique
- Rapport de fin de journée admin (imprimable, toutes boutiques ou filtré)
- Rapport journalier caissier (ses propres ventes uniquement)
- Journal d'audit automatique (créations/modifications/suppressions tracées)
- **Transferts entre boutiques** (créer/expédier, réceptionner totalement ou partiellement, historique)
- **Inventaire** (comptage réel vs stock théorique, écart avec justification obligatoire, correction automatique du stock à la clôture)
- **Stock global multi-boutiques** (vue consolidée par article, détail par boutique)
- **Fournisseurs** (création, modification, désactivation)
- **Achats fournisseurs** : commandes, réception progressive (partielle possible, plusieurs fois), retours fournisseurs, annulation si rien reçu
- Sécurité : RLS par boutique, refus par défaut, aucune donnée sensible dans le code
- Déconnexion (admin et caissier)

## 🚧 Prochaines phases (dans l'ordre du cahier des charges)

**Phase 3 complément — Stock avancé**
(terminé)

**Phase 4 — Achats fournisseurs**
(terminé)

**Phase 9 — Rapports & statistiques avancés**
- Tableau de bord admin enrichi : fait ✅ (CA jour/semaine/mois/année, activité complète, alertes stock, top/flop produits, boutiques performantes, graphique 30 jours, filtre par boutique)
- **Ventes (vue admin)** : toutes boutiques, filtrable (boutique, dates, moyen de paiement), détail complet par vente
- **Export CSV** : articles, mouvements de stock, ventes (compatible Excel)
- **Recherche globale** (articles, clients, fournisseurs, boutiques, ventes, transferts, achats, utilisateurs)
- **Notifications** (ruptures, stock faible, écarts de caisse, transferts/achats en attente — calculées en direct)
- **Promotions** (remise % ou montant fixe, sur un article ou toute une catégorie, période définie, appliquée automatiquement en caisse)
- Graphiques par boutique/catégorie/produit
- Export PDF/Excel/CSV
- Performance des boutiques et des caissiers (classements)

**Phase 10 — Surveillance & notifications**
- Centre de notifications (rupture, écarts de caisse, transferts en attente...)
- Page de surveillance des anomalies
- Activité récente en direct sur le tableau de bord

**Autres**
- Promotions (remises par produit/catégorie/période)
- Recherche globale
- Import/export d'articles (Excel/CSV)
- Paramètres généraux (logo, devise, numérotation des documents)

## Note sur l'approche
On avance module par module, chacun testé avant de passer au suivant — comme demandé dans le cahier des charges. Dire simplement "continue" reprend la liste ci-dessus dans l'ordre ; pour prioriser différemment, il suffit de le préciser.
