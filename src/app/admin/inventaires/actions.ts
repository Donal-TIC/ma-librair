'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function verifierAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié.')
  const { data: profil } = await supabase.from('profils').select('role').eq('id', user.id).single()
  if (profil?.role !== 'admin') throw new Error("Action réservée à l'administrateur.")
  return { supabase, user }
}

export async function lancerInventaire(boutiqueId: string) {
  const { supabase, user } = await verifierAdmin()

  const { data: articles } = await supabase
    .from('articles')
    .select('id, nom, quantite_stock')
    .eq('boutique_id', boutiqueId)
    .eq('actif', true)
  if (!articles || articles.length === 0) throw new Error('Aucun article actif dans cette boutique.')

  const { data: numeroData } = await supabase.rpc('generer_numero_inventaire')
  const numero = numeroData as string

  const { data: inventaire, error } = await supabase
    .from('inventaires')
    .insert({ numero, boutique_id: boutiqueId, created_by: user.id })
    .select('id')
    .single()
  if (error) throw new Error(error.message)

  const lignes = articles.map((a) => ({
    inventaire_id: inventaire.id,
    article_id: a.id,
    nom_article: a.nom,
    stock_theorique: a.quantite_stock,
  }))
  const { error: erreurLignes } = await supabase.from('inventaires_lignes').insert(lignes)
  if (erreurLignes) throw new Error(erreurLignes.message)

  revalidatePath('/admin/inventaires')
  redirect(`/admin/inventaires/${inventaire.id}`)
}

export async function enregistrerComptage(ligneId: string, stockCompte: number, justification: string) {
  const { supabase } = await verifierAdmin()

  const { data: ligne } = await supabase.from('inventaires_lignes').select('stock_theorique').eq('id', ligneId).single()
  if (!ligne) throw new Error('Ligne introuvable.')

  const ecart = stockCompte - ligne.stock_theorique
  if (ecart !== 0 && !justification.trim()) {
    throw new Error('Une justification est obligatoire quand un écart est constaté.')
  }

  const { error } = await supabase
    .from('inventaires_lignes')
    .update({ stock_compte: stockCompte, ecart, justification })
    .eq('id', ligneId)
  if (error) throw new Error(error.message)
}

export async function cloturerInventaire(inventaireId: string) {
  const { supabase, user } = await verifierAdmin()

  const { data: inventaire } = await supabase.from('inventaires').select('boutique_id, numero').eq('id', inventaireId).single()
  if (!inventaire) throw new Error('Inventaire introuvable.')

  const { data: lignes } = await supabase
    .from('inventaires_lignes')
    .select('*')
    .eq('inventaire_id', inventaireId)
    .not('stock_compte', 'is', null)

  for (const ligne of lignes ?? []) {
    if (ligne.ecart === 0) continue

    await supabase.from('articles').update({ quantite_stock: ligne.stock_compte }).eq('id', ligne.article_id)
    await supabase.from('mouvements_stock').insert({
      boutique_id: inventaire.boutique_id,
      article_id: ligne.article_id,
      type: 'correction',
      quantite: Math.abs(ligne.ecart),
      quantite_avant: ligne.stock_theorique,
      quantite_apres: ligne.stock_compte,
      motif: `Inventaire ${inventaire.numero} : ${ligne.justification}`,
      effectue_par: user.id,
    })
  }

  const { error } = await supabase
    .from('inventaires')
    .update({ statut: 'termine', termine_at: new Date().toISOString() })
    .eq('id', inventaireId)
  if (error) throw new Error(error.message)

  revalidatePath(`/admin/inventaires/${inventaireId}`)
  revalidatePath('/admin/inventaires')
}
