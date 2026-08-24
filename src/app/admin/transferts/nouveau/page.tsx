import { createClient } from '@/lib/supabase/server'
import FormulaireTransfert from './FormulaireTransfert'

export default async function NouveauTransfert() {
  const supabase = createClient()
  const { data: boutiques } = await supabase.from('boutiques').select('id, nom').eq('actif', true)

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Nouveau transfert</h2>
      <FormulaireTransfert boutiques={boutiques ?? []} />
    </div>
  )
}
