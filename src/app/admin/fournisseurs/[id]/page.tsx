import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FormulaireFournisseur from '../FormulaireFournisseur'
import { modifierFournisseur, type FournisseurFormData } from '../actions'

export default async function ModifierFournisseur({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const [{ data: fournisseur }, { data: boutiques }] = await Promise.all([
    supabase.from('fournisseurs').select('*').eq('id', params.id).single(),
    supabase.from('boutiques').select('id, nom').eq('actif', true),
  ])
  if (!fournisseur) notFound()

  async function valider(donnees: FournisseurFormData) {
    'use server'
    await modifierFournisseur(params.id, donnees)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Modifier le fournisseur</h2>
      <FormulaireFournisseur boutiques={boutiques ?? []} valeursInitiales={fournisseur} onValider={valider} libelleBouton="Enregistrer" />
    </div>
  )
}
