import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FormulaireBoutique from './FormulaireBoutique'

export default async function ModifierBoutique({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: boutique } = await supabase.from('boutiques').select('*').eq('id', params.id).single()

  if (!boutique) notFound()

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Modifier la boutique</h2>
      <FormulaireBoutique boutique={boutique} />
    </div>
  )
}
