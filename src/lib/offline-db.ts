import Dexie, { type Table } from 'dexie'

// Cette base locale permet à la caisse de continuer à vendre même sans internet.
// Chaque vente/dépense faite hors-ligne est stockée ici avec synced = false,
// puis renvoyée vers Supabase dès que la connexion revient (voir lib/sync.ts).

export interface VenteLocale {
  id?: number
  uuid: string
  boutique_id: string
  caissier_id: string
  numero_recu: string
  montant_total: number
  montant_paye: number
  monnaie_rendue: number
  mode_paiement: string
  lignes: { article_id: string; nom_article: string; prix_unitaire: number; quantite: number; sous_total: number; est_gros: boolean; prix_reference: number; prix_achat_reference: number }[]
  created_at: string
  synced: boolean
}

export interface DepenseLocale {
  id?: number
  uuid: string
  boutique_id: string
  motif: string
  montant: number
  effectue_par: string
  created_at: string
  synced: boolean
}

export interface ArticleCache {
  id: string
  boutique_id: string
  code_barre: string
  nom: string
  prix_achat: number
  prix_vente: number
  quantite_stock: number
}

class MaLibrairDB extends Dexie {
  ventes!: Table<VenteLocale>
  depenses!: Table<DepenseLocale>
  articles_cache!: Table<ArticleCache>

  constructor() {
    super('ma-librair-offline')
    this.version(1).stores({
      ventes: '++id, uuid, created_at',
      depenses: '++id, uuid, created_at',
      articles_cache: 'id, code_barre',
    })
  }
}

export const offlineDB = new MaLibrairDB()
