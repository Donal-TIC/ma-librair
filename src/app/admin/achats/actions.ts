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

interface LigneAchat { article_id: string; nom_article: string; quantite: number; prix_achat: number }

export async function creerAchat(fournisseurId: string, boutiqueId: string, lignes: LigneAchat[]) {
  const { supabase, user } = await verifierAdmin()
  if (lignes.length === 0) throw new Error('Ajoutez au moins un article à commander.')

  const montantTotal = lignes.reduce((s, l) => s + l.quantite * l.prix_achat, 0)
  const { data: numeroData } = await supabase.rpc('generer_numero_achat')
  const numero = numeroData as string

  const { data: achat, error } = await supabase
    .from('achats')
    .insert({ numero, fournisseur_id: fournisseurId, boutique_id: boutiqueId, statut: 'commandee', montant_total: montantTotal, created_by: user.id })
    .select('id')
    .single()
  if (error) throw new Error(error.message)

  const { error: erreurLignes } = await supabase.from('achats_lignes').insert(
    lignes.map((l) => ({
      achat_id: achat.id,
      article_id: l.article_id,
      nom_article: l.nom_article,
      quantite_commandee: l.quantite,
      prix_achat_unitaire: l.prix_achat,
    }))
  )
  if (erreurLignes) throw new Error(erreurLignes.message)

  revalidatePath('/admin/achats')
  redirect(`/admin/achats/${achat.id}`)
}

export async function receptionnerAchat(achatId: string, quantitesRecuesMaintenant: Record<string, number>) {
  const { supabase, user } = await verifierAdmin()

  const { data: achat } = await supabase.from('achats').select('boutique_id, numero').eq('id', achatId).single()
  if (!achat) throw new Error('Achat introuvable.')

  const { data: lignes } = await supabase.from('achats_lignes').select('*').eq('achat_id', achatId)

  let toutRecu = true
  let auMoinsUnRecu = false

  for (const ligne of lignes ?? []) {
    const qteMaintenant = quantitesRecuesMaintenant[ligne.id] ?? 0
    const nouveauTotal = ligne.quantite_recue + qteMaintenant

    if (nouveauTotal > ligne.quantite_commandee) {
      throw new Error(`La quantité reçue dépasse la quantité commandée pour "${ligne.nom_article}".`)
    }
    if (nouveauTotal < ligne.quantite_commandee) toutRecu = false
    if (qteMaintenant > 0) auMoinsUnRecu = true
    if (qteMaintenant <= 0) continue

    await supabase.from('achats_lignes').update({ quantite_recue: nouveauTotal }).eq('id', ligne.id)

    const { data: article } = await supabase.from('articles').select('quantite_stock').eq('id', ligne.article_id).single()
    if (article) {
      await supabase.from('articles').update({ quantite_stock: article.quantite_stock + qteMaintenant }).eq('id', ligne.article_id)
      await supabase.from('mouvements_stock').insert({
        boutique_id: achat.boutique_id,
        article_id: ligne.article_id,
        type: 'entree',
        quantite: qteMaintenant,
        quantite_avant: article.quantite_stock,
        quantite_apres: article.quantite_stock + qteMaintenant,
        motif: `Réception achat ${achat.numero}`,
        effectue_par: user.id,
      })
    }
  }

  if (!auMoinsUnRecu) throw new Error('Renseignez au moins une quantité reçue supérieure à 0.')

  await supabase.from('achats').update({ statut: toutRecu ? 'recue' : 'partiellement_recue' }).eq('id', achatId)

  revalidatePath(`/admin/achats/${achatId}`)
  revalidatePath('/admin/achats')
}

export async function annulerAchat(achatId: string) {
  const { supabase } = await verifierAdmin()

  const { data: lignes } = await supabase.from('achats_lignes').select('quantite_recue').eq('achat_id', achatId)
  if ((lignes ?? []).some((l) => l.quantite_recue > 0)) {
    throw new Error('Impossible d\'annuler : des articles ont déjà été reçus sur cette commande.')
  }

  const { error } = await supabase.from('achats').update({ statut: 'annulee' }).eq('id', achatId)
  if (error) throw new Error(error.message)

  revalidatePath(`/admin/achats/${achatId}`)
  revalidatePath('/admin/achats')
}

export async function creerRetourFournisseur(achatId: string, articleId: string, nomArticle: string, boutiqueId: string, quantite: number, motif: string) {
  const { supabase, user } = await verifierAdmin()

  const { data: article } = await supabase.from('articles').select('quantite_stock').eq('id', articleId).single()
  if (!article) throw new Error('Article introuvable.')
  if (article.quantite_stock < quantite) throw new Error('Stock insuffisant pour ce retour.')

  await supabase.from('articles').update({ quantite_stock: article.quantite_stock - quantite }).eq('id', articleId)
  await supabase.from('mouvements_stock').insert({
    boutique_id: boutiqueId,
    article_id: articleId,
    type: 'sortie',
    quantite,
    quantite_avant: article.quantite_stock,
    quantite_apres: article.quantite_stock - quantite,
    motif: `Retour fournisseur : ${motif}`,
    effectue_par: user.id,
  })

  const { error } = await supabase.from('retours_fournisseurs').insert({
    achat_id: achatId, boutique_id: boutiqueId, article_id: articleId, nom_article: nomArticle, quantite, motif, effectue_par: user.id,
  })
  if (error) throw new Error(error.message)

  revalidatePath(`/admin/achats/${achatId}`)
}
