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

export async function creerBoutique(donnees: { nom: string; adresse: string; telephone: string; budget_initial: number }) {
  const { supabase, user } = await verifierAdmin()

  const { error } = await supabase.from('boutiques').insert({
    ...donnees,
    created_by: user.id,
  })
  if (error) throw new Error("Erreur lors de la création de la boutique : " + error.message)

  revalidatePath('/admin/boutiques')
  redirect('/admin/boutiques')
}

export async function modifierBoutique(boutiqueId: string, donnees: { nom: string; adresse: string; telephone: string; actif: boolean }) {
  const { supabase } = await verifierAdmin()

  const { error } = await supabase.from('boutiques').update(donnees).eq('id', boutiqueId)
  if (error) throw new Error("Erreur lors de la modification : " + error.message)

  revalidatePath('/admin/boutiques')
}

// Création d'un compte caissier : nécessite les droits d'administration Supabase (service_role),
// disponibles uniquement côté serveur, jamais exposés au navigateur.
export async function creerCaissier(donnees: { email: string; motDePasse: string; nomComplet: string; boutiqueId: string }) {
  await verifierAdmin()

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "La clé SUPABASE_SERVICE_ROLE_KEY n'est pas configurée sur le serveur. " +
      "Ajoutez-la dans les variables d'environnement (voir SECURITY.md) pour pouvoir créer des comptes caissiers."
    )
  }

  // Client "admin" distinct : utilise la clé service_role, UNIQUEMENT dans ce fichier serveur.
  // Cette clé ne doit jamais être préfixée par NEXT_PUBLIC_ et n'est donc jamais envoyée au navigateur.
  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: nouvelUtilisateur, error: erreurCreation } = await supabaseAdmin.auth.admin.createUser({
    email: donnees.email,
    password: donnees.motDePasse,
    email_confirm: true, // pas d'email de confirmation nécessaire, le compte est créé directement actif
  })
  if (erreurCreation) throw new Error("Erreur lors de la création du compte : " + erreurCreation.message)

  const { error: erreurProfil } = await supabaseAdmin.from('profils').insert({
    id: nouvelUtilisateur.user.id,
    nom_complet: donnees.nomComplet,
    role: 'caissier',
    boutique_id: donnees.boutiqueId,
  })
  if (erreurProfil) throw new Error("Erreur lors de la création du profil : " + erreurProfil.message)

  revalidatePath(`/admin/boutiques/${donnees.boutiqueId}/caissiers`)
}

export async function desactiverCaissier(profilId: string, boutiqueId: string) {
  const { supabase } = await verifierAdmin()

  const { error } = await supabase.from('profils').update({ actif: false }).eq('id', profilId)
  if (error) throw new Error("Erreur : " + error.message)

  revalidatePath(`/admin/boutiques/${boutiqueId}/caissiers`)
}

export async function reactiverCaissier(profilId: string, boutiqueId: string) {
  const { supabase } = await verifierAdmin()

  const { error } = await supabase.from('profils').update({ actif: true }).eq('id', profilId)
  if (error) throw new Error("Erreur : " + error.message)

  revalidatePath(`/admin/boutiques/${boutiqueId}/caissiers`)
}
