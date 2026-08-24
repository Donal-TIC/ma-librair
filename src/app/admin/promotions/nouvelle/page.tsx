import { createClient } from '@/lib/supabase/server'
import FormulairePromotion from './FormulairePromotion'

export default async function NouvellePromotion() {
  const supabase = createClient()
  const [{ data: boutiques }, { data: categories }] = await Promise.all([
    supabase.from('boutiques').select('id, nom').eq('actif', true),
    supabase.from('categories').select('id, nom'),
  ])

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Nouvelle promotion</h2>
      <FormulairePromotion boutiques={boutiques ?? []} categories={categories ?? []} />
    </div>
  )
}
