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
- Sécurité : RLS par boutique, refus par défaut, aucune donnée sensible dans le code

## 🚧 Prochaines phases (dans l'ordre du cahier des charges)

**Phase 3 complément — Stock avancé**
- Transferts entre boutiques (créer, expédier, réceptionner, réception partielle)
- Inventaire (stock théorique vs compté, écart, justification)
- Stock global multi-boutiques (vue consolidée par article)

**Phase 4 — Achats fournisseurs**
- Commandes fournisseurs (brouillon → commandée → reçue)
- Réception (partielle ou totale)
- Retours fournisseurs

**Phase 9 — Rapports & statistiques avancés**
- Tableau de bord admin enrichi (CA jour/semaine/mois/année, comparatifs boutiques, top produits)
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
