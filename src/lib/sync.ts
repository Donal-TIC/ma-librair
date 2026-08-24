import { createClient } from '@/lib/supabase/client'
import { offlineDB } from '@/lib/offline-db'

// À appeler : au démarrage de l'app, et à chaque fois que window redevient "online".
export async function synchroniser() {
  if (!navigator.onLine) return

  const supabase = createClient()

  // 1. Synchroniser les ventes en attente (filtre en mémoire : "synced" n'est pas indexé,
  //    plus simple et plus sûr que d'indexer un booléen dans IndexedDB)
  const ventesEnAttente = (await offlineDB.ventes.toArray()).filter((v) => !v.synced)
  for (const vente of ventesEnAttente) {
    const { data, error } = await supabase
      .from('ventes')
      .insert({
        boutique_id: vente.boutique_id,
        caissier_id: vente.caissier_id,
        session_id: vente.session_id,
        client_id: vente.client_id,
        numero_recu: vente.numero_recu,
        montant_total: vente.montant_total,
        montant_paye: vente.montant_paye,
        monnaie_rendue: vente.monnaie_rendue,
        created_at: vente.created_at,
      })
      .select()
      .single()

    if (!error && data) {
      const lignes = vente.lignes.map((l) => ({ ...l, vente_id: data.id }))
      await supabase.from('lignes_vente').insert(lignes)
      if (vente.paiements.length > 0) {
        await supabase.from('paiements_vente').insert(vente.paiements.map((p) => ({ ...p, vente_id: data.id })))
      }
      await offlineDB.ventes.update(vente.id!, { synced: true })
    }
  }

  // 2. Synchroniser les dépenses en attente
  const depensesEnAttente = (await offlineDB.depenses.toArray()).filter((d) => !d.synced)
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
    .select('id, boutique_id, code_barre, nom, prix_achat, prix_vente, prix_gros, quantite_min_gros, quantite_stock, categorie_id')

  // Promotions actives aujourd'hui : on calcule le prix promo à appliquer par article
  const aujourdHui = new Date().toISOString().slice(0, 10)
  const { data: promotions } = await supabase
    .from('promotions')
    .select('article_id, categorie_id, type, valeur')
    .eq('actif', true)
    .lte('date_debut', aujourdHui)
    .gte('date_fin', aujourdHui)

  if (articles) {
    const articlesAvecPromo = articles.map((a) => {
      const promo = (promotions ?? []).find((p) => p.article_id === a.id || (p.categorie_id && p.categorie_id === (a as any).categorie_id))
      const prixPromo = promo
        ? promo.type === 'pourcentage'
          ? Math.max(0, a.prix_vente * (1 - Number(promo.valeur) / 100))
          : Math.max(0, a.prix_vente - Number(promo.valeur))
        : null
      const { categorie_id, ...articleSansCategorie } = a as any
      return { ...articleSansCategorie, prix_promo: prixPromo }
    })
    await offlineDB.articles_cache.clear()
    await offlineDB.articles_cache.bulkPut(articlesAvecPromo)
  }
}
