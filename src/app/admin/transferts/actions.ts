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

interface LigneTransfert { article_id: string; nom_article: string; quantite: number }

export async function creerTransfert(boutiqueSourceId: string, boutiqueDestinationId: string, lignes: LigneTransfert[]) {
  const { supabase, user } = await verifierAdmin()

  if (boutiqueSourceId === boutiqueDestinationId) throw new Error('La boutique source et destination doivent être différentes.')
  if (lignes.length === 0) throw new Error('Ajoutez au moins un article à transférer.')

  // Vérification et décrément du stock source, article par article
  for (const ligne of lignes) {
    const { data: article } = await supabase.from('articles').select('quantite_stock, nom').eq('id', ligne.article_id).single()
    if (!article) throw new Error(`Article introuvable : ${ligne.nom_article}`)
    if (article.quantite_stock < ligne.quantite) {
      throw new Error(`Stock insuffisant pour "${article.nom}" : ${article.quantite_stock} disponible(s), ${ligne.quantite} demandé(s).`)
    }
  }

  const { data: numeroData } = await supabase.rpc('generer_numero_transfert')
  const numero = numeroData as string

  const { data: transfert, error } = await supabase
    .from('transferts')
    .insert({
      numero,
      boutique_source_id: boutiqueSourceId,
      boutique_destination_id: boutiqueDestinationId,
      statut: 'expedie',
      created_by: user.id,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)

  for (const ligne of lignes) {
    await supabase.from('transferts_lignes').insert({
      transfert_id: transfert.id,
      article_id: ligne.article_id,
      nom_article: ligne.nom_article,
      quantite_envoyee: ligne.quantite,
    })

    const { data: article } = await supabase.from('articles').select('quantite_stock').eq('id', ligne.article_id).single()
    if (article) {
      await supabase.from('articles').update({ quantite_stock: article.quantite_stock - ligne.quantite }).eq('id', ligne.article_id)
      await supabase.from('mouvements_stock').insert({
        boutique_id: boutiqueSourceId,
        article_id: ligne.article_id,
        type: 'sortie',
        quantite: ligne.quantite,
        quantite_avant: article.quantite_stock,
        quantite_apres: article.quantite_stock - ligne.quantite,
        motif: `Transfert ${numero} expédié`,
        effectue_par: user.id,
      })
    }
  }

  revalidatePath('/admin/transferts')
  redirect(`/admin/transferts/${transfert.id}`)
}

export async function receptionnerTransfert(transfertId: string, quantitesRecues: Record<string, number>) {
  const { supabase, user } = await verifierAdmin()

  const { data: transfert } = await supabase.from('transferts').select('*').eq('id', transfertId).single()
  if (!transfert) throw new Error('Transfert introuvable.')
  if (transfert.statut === 'recu') throw new Error('Ce transfert a déjà été entièrement reçu.')

  const { data: lignes } = await supabase.from('transferts_lignes').select('*').eq('transfert_id', transfertId)

  let toutRecu = true

  for (const ligne of lignes ?? []) {
    const quantiteRecue = quantitesRecues[ligne.id] ?? 0
    if (quantiteRecue <= 0) { toutRecu = false; continue }
    if (quantiteRecue > ligne.quantite_envoyee) throw new Error(`Quantité reçue supérieure à la quantité envoyée pour "${ligne.nom_article}".`)
    if (quantiteRecue < ligne.quantite_envoyee) toutRecu = false

    await supabase.from('transferts_lignes').update({ quantite_recue: quantiteRecue }).eq('id', ligne.id)

    const { data: article } = await supabase.from('articles').select('quantite_stock').eq('id', ligne.article_id).single()
    if (article) {
      await supabase.from('articles').update({ quantite_stock: article.quantite_stock + quantiteRecue }).eq('id', ligne.article_id)
      await supabase.from('mouvements_stock').insert({
        boutique_id: transfert.boutique_destination_id,
        article_id: ligne.article_id,
        type: 'entree',
        quantite: quantiteRecue,
        quantite_avant: article.quantite_stock,
        quantite_apres: article.quantite_stock + quantiteRecue,
        motif: `Transfert ${transfert.numero} reçu`,
        effectue_par: user.id,
      })
    }
  }

  await supabase.from('transferts').update({
    statut: toutRecu ? 'recu' : 'partiellement_recu',
    recu_at: new Date().toISOString(),
  }).eq('id', transfertId)

  revalidatePath(`/admin/transferts/${transfertId}`)
  revalidatePath('/admin/transferts')
}
