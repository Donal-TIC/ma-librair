'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface PromotionFormData {
  boutique_id: string
  article_id: string | null
  categorie_id: string | null
  type: 'pourcentage' | 'fixe'
  valeur: number
  date_debut: string
  date_fin: string
}

async function verifierAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié.')
  const { data: profil } = await supabase.from('profils').select('role').eq('id', user.id).single()
  if (profil?.role !== 'admin') throw new Error("Action réservée à l'administrateur.")
  return { supabase, user }
}

export async function creerPromotion(donnees: PromotionFormData) {
  const { supabase, user } = await verifierAdmin()

  if (!donnees.article_id && !donnees.categorie_id) {
    throw new Error('Choisissez un article ou une catégorie concernée par la promotion.')
  }

  const { error } = await supabase.from('promotions').insert({ ...donnees, created_by: user.id })
  if (error) throw new Error(error.message)

  revalidatePath('/admin/promotions')
  redirect('/admin/promotions')
}

export async function desactiverPromotion(id: string) {
  const { supabase } = await verifierAdmin()
  const { error } = await supabase.from('promotions').update({ actif: false }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/promotions')
}
