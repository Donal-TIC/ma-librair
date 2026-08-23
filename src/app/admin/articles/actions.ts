'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface ArticleFormData {
  boutique_id: string
  categorie_id: string | null
  fournisseur_id: string | null
  nom: string
  description: string
  prix_achat: number
  prix_vente: number
  quantite_stock: number
  seuil_alerte: number
  image_url: string | null
  prix_gros: number | null
  quantite_min_gros: number
}

// Vérifie que l'utilisateur connecté est bien admin avant toute écriture.
// Sécurité en profondeur : même si la RLS protège déjà la base, on double-vérifie
// ici côté serveur avant d'exécuter la moindre action.
async function verifierAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié.')

  const { data: profil } = await supabase.from('profils').select('role').eq('id', user.id).single()
  if (profil?.role !== 'admin') throw new Error("Action réservée à l'administrateur.")

  return { supabase, user }
}

export async function creerArticle(donnees: ArticleFormData) {
  const { supabase } = await verifierAdmin()

  // Le code-barre est généré côté base de données (fonction sécurisée),
  // jamais construit côté client, pour garantir son unicité.
  const { data: codeBarre, error: erreurCode } = await supabase.rpc('generer_code_barre_article')
  if (erreurCode) throw new Error("Impossible de générer le code-barre : " + erreurCode.message)

  const { error } = await supabase.from('articles').insert({
    ...donnees,
    code_barre: codeBarre,
  })
  if (error) throw new Error("Erreur lors de la création : " + error.message)

  revalidatePath('/admin/articles')
  redirect('/admin/articles')
}

export async function modifierArticle(articleId: string, donnees: ArticleFormData) {
  const { supabase } = await verifierAdmin()

  const { error } = await supabase.from('articles').update(donnees).eq('id', articleId)
  if (error) throw new Error("Erreur lors de la modification : " + error.message)

  revalidatePath('/admin/articles')
  redirect('/admin/articles')
}

export async function supprimerArticle(articleId: string) {
  const { supabase } = await verifierAdmin()

  // On désactive l'article plutôt que de le supprimer définitivement,
  // pour conserver l'historique des ventes et mouvements liés (traçabilité).
  const { error } = await supabase.from('articles').update({ actif: false }).eq('id', articleId)
  if (error) throw new Error("Erreur lors de la suppression : " + error.message)

  revalidatePath('/admin/articles')
}

export async function ajusterStock(articleId: string, boutiqueId: string, quantite: number, type: 'entree' | 'sortie' | 'perte' | 'correction', motif: string) {
  const { supabase, user } = await verifierAdmin()

  const { data: article } = await supabase.from('articles').select('quantite_stock').eq('id', articleId).single()
  if (!article) throw new Error('Article introuvable.')

  const quantiteAvant = article.quantite_stock
  const quantiteApres = type === 'sortie' || type === 'perte' ? quantiteAvant - quantite : quantiteAvant + quantite

  if (quantiteApres < 0) throw new Error('Le stock ne peut pas devenir négatif.')

  const { error: erreurMaj } = await supabase.from('articles').update({ quantite_stock: quantiteApres }).eq('id', articleId)
  if (erreurMaj) throw new Error(erreurMaj.message)

  const { error: erreurMouvement } = await supabase.from('mouvements_stock').insert({
    boutique_id: boutiqueId,
    article_id: articleId,
    type,
    quantite,
    quantite_avant: quantiteAvant,
    quantite_apres: quantiteApres,
    motif,
    effectue_par: user.id,
  })
  if (erreurMouvement) throw new Error(erreurMouvement.message)

  revalidatePath('/admin/articles')
  revalidatePath('/admin/stock')
}
