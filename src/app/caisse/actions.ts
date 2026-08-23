'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function utilisateurConnecte() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié.')
  const { data: profil } = await supabase.from('profils').select('boutique_id, role').eq('id', user.id).single()
  if (!profil?.boutique_id) throw new Error('Aucune boutique associée à ce compte.')
  return { supabase, user, boutiqueId: profil.boutique_id }
}

export async function ouvrirCaisse(fondInitial: number) {
  const { supabase, user, boutiqueId } = await utilisateurConnecte()

  // Sécurité : on empêche d'ouvrir deux sessions en même temps pour le même caissier
  const { data: sessionExistante } = await supabase
    .from('sessions_caisse')
    .select('id')
    .eq('caissier_id', user.id)
    .eq('statut', 'ouverte')
    .maybeSingle()
  if (sessionExistante) throw new Error('Une session de caisse est déjà ouverte.')

  const { data, error } = await supabase
    .from('sessions_caisse')
    .insert({ boutique_id: boutiqueId, caissier_id: user.id, fond_initial: fondInitial })
    .select('id')
    .single()
  if (error) throw new Error(error.message)

  revalidatePath('/caisse')
  return data.id as string
}

export async function enregistrerMouvementCaisse(sessionId: string, type: 'entree' | 'sortie', montant: number, motif: string) {
  const { supabase, user } = await utilisateurConnecte()

  const { error } = await supabase.from('mouvements_caisse').insert({
    session_id: sessionId,
    type,
    montant,
    motif,
    effectue_par: user.id,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/caisse')
}

export async function fermerCaisse(sessionId: string, montantCompte: number) {
  const { supabase } = await utilisateurConnecte()

  const { data: session } = await supabase.from('sessions_caisse').select('*').eq('id', sessionId).single()
  if (!session) throw new Error('Session introuvable.')

  const { data: ventesSession } = await supabase
    .from('ventes')
    .select('id, annulee, paiements_vente(mode, montant)')
    .eq('session_id', sessionId)

  const totalEspeces = (ventesSession ?? [])
    .filter((v: any) => !v.annulee)
    .flatMap((v: any) => v.paiements_vente ?? [])
    .filter((p: any) => p.mode === 'especes')
    .reduce((s: number, p: any) => s + Number(p.montant), 0)

  const { data: mouvements } = await supabase.from('mouvements_caisse').select('type, montant').eq('session_id', sessionId)
  const totalEntrees = (mouvements ?? []).filter((m) => m.type === 'entree').reduce((s, m) => s + Number(m.montant), 0)
  const totalSorties = (mouvements ?? []).filter((m) => m.type === 'sortie').reduce((s, m) => s + Number(m.montant), 0)

  const montantTheorique = Number(session.fond_initial) + totalEspeces + totalEntrees - totalSorties
  const ecart = montantCompte - montantTheorique

  const { error } = await supabase
    .from('sessions_caisse')
    .update({
      statut: 'fermee',
      fermee_at: new Date().toISOString(),
      montant_theorique: montantTheorique,
      montant_compte: montantCompte,
      ecart,
    })
    .eq('id', sessionId)
  if (error) throw new Error(error.message)

  revalidatePath('/caisse')
  return { montantTheorique, ecart }
}

export async function rechercherOuCreerClient(boutiqueId: string, nom: string, telephone: string) {
  const { supabase } = await utilisateurConnecte()

  const { data, error } = await supabase
    .from('clients')
    .insert({ boutique_id: boutiqueId, nom, telephone })
    .select('id, nom, telephone')
    .single()
  if (error) throw new Error(error.message)

  return data
}
