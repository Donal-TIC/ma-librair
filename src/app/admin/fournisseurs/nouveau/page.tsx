import { createClient } from '@/lib/supabase/server'
import FormulaireFournisseur from '../FormulaireFournisseur'
import { creerFournisseur, type FournisseurFormData } from '../actions'

export default async function NouveauFournisseur() {
  const supabase = createClient()
  const { data: boutiques } = await supabase.from('boutiques').select('id, nom').eq('actif', true)

  async function valider(donnees: FournisseurFormData) {
    'use server'
    await creerFournisseur(donnees)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Nouveau fournisseur</h2>
      <FormulaireFournisseur boutiques={boutiques ?? []} onValider={valider} libelleBouton="Créer le fournisseur" />
    </div>
  )
}
