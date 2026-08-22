import { createClient } from '@/lib/supabase/client'
import { offlineDB } from '@/lib/offline-db'

// À appeler : au démarrage de l'app, et à chaque fois que window redevient "online".
export async function synchroniser() {
  if (!navigator.onLine) return

  const supabase = createClient()

  // 1. Synchroniser les ventes en attente
  const ventesEnAttente = await offlineDB.ventes.where('synced').equals(0 as unknown as boolean).toArray()
  for (const vente of ventesEnAttente) {
    const { data, error } = await supabase
      .from('ventes')
      .insert({
        boutique_id: vente.boutique_id,
        caissier_id: vente.caissier_id,
        numero_recu: vente.numero_recu,
        montant_total: vente.montant_total,
        montant_paye: vente.montant_paye,
        monnaie_rendue: vente.monnaie_rendue,
        mode_paiement: vente.mode_paiement,
        created_at: vente.created_at,
      })
      .select()
      .single()

    if (!error && data) {
      const lignes = vente.lignes.map((l) => ({ ...l, vente_id: data.id }))
      await supabase.from('lignes_vente').insert(lignes)
      await offlineDB.ventes.update(vente.id!, { synced: true })
    }
  }

  // 2. Synchroniser les dépenses en attente
  const depensesEnAttente = await offlineDB.depenses.where('synced').equals(0 as unknown as boolean).toArray()
  for (const depense of depensesEnAttente) {
    const { error } = await supabase.from('depenses').insert({
      boutique_id: depense.boutique_id,
      motif: depense.motif,
      montant: depense.montant,
      effectue_par: depense.effectue_par,
      created_at: depense.created_at,
    })
    if (!error) {
      await offlineDB.depenses.update(depense.id!, { synced: true })
    }
  }

  // 3. Rafraîchir le cache local des articles (pour vendre hors-ligne avec les bons prix/stocks)
  const { data: articles } = await supabase
    .from('articles')
    .select('id, boutique_id, code_barre, nom, prix_achat, prix_vente, quantite_stock')
  if (articles) {
    await offlineDB.articles_cache.clear()
    await offlineDB.articles_cache.bulkPut(articles)
  }
}
