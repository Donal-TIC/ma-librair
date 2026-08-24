'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface FournisseurFormData {
  boutique_id: string
  nom: string
  telephone: string
  adresse: string
  personne_contact: string
  conditions_paiement: string
  notes: string
}

async function verifierAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié.')
  const { data: profil } = await supabase.from('profils').select('role').eq('id', user.id).single()
  if (profil?.role !== 'admin') throw new Error("Action réservée à l'administrateur.")
  return { supabase }
}

export async function creerFournisseur(donnees: FournisseurFormData) {
  const { supabase } = await verifierAdmin()
  const { error } = await supabase.from('fournisseurs').insert(donnees)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/fournisseurs')
  redirect('/admin/fournisseurs')
}

export async function modifierFournisseur(id: string, donnees: FournisseurFormData) {
  const { supabase } = await verifierAdmin()
  const { error } = await supabase.from('fournisseurs').update(donnees).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/fournisseurs')
  redirect('/admin/fournisseurs')
}

export async function desactiverFournisseur(id: string) {
  const { supabase } = await verifierAdmin()
  const { error } = await supabase.from('fournisseurs').update({ actif: false }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/fournisseurs')
}
