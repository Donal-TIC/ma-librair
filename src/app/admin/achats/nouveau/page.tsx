import { createClient } from '@/lib/supabase/server'
import FormulaireAchat from './FormulaireAchat'

export default async function NouvelAchat() {
  const supabase = createClient()
  const [{ data: fournisseurs }, { data: boutiques }] = await Promise.all([
    supabase.from('fournisseurs').select('id, nom').eq('actif', true),
    supabase.from('boutiques').select('id, nom').eq('actif', true),
  ])

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Nouvelle commande fournisseur</h2>
      <FormulaireAchat fournisseurs={fournisseurs ?? []} boutiques={boutiques ?? []} />
    </div>
  )
}
