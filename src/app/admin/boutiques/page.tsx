import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function PageBoutiques() {
  const supabase = createClient()

  const { data: boutiques } = await supabase
    .from('boutiques')
    .select('id, nom, adresse, telephone, actif, budget_initial')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Boutiques & caisses</h2>
        <Link href="/admin/boutiques/nouvelle" className="btn-primary text-center">+ Nouvelle boutique</Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(boutiques ?? []).map((b) => (
          <div key={b.id} className="card space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-gray-800">{b.nom}</h3>
              {!b.actif && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>}
            </div>
            {b.adresse && <p className="text-sm text-gray-500">{b.adresse}</p>}
            {b.telephone && <p className="text-sm text-gray-500">{b.telephone}</p>}
            <p className="text-sm text-gray-500">Budget initial : {Number(b.budget_initial).toLocaleString('fr-FR')} FCFA</p>
            <div className="flex gap-3 pt-2 text-sm">
              <Link href={`/admin/boutiques/${b.id}`} className="text-primary-600 hover:underline">Modifier</Link>
              <Link href={`/admin/boutiques/${b.id}/caissiers`} className="text-primary-600 hover:underline">Gérer les caissiers</Link>
            </div>
          </div>
        ))}
        {(!boutiques || boutiques.length === 0) && (
          <p className="text-gray-400 col-span-full text-center py-8">Aucune boutique créée pour le moment.</p>
        )}
      </div>
    </div>
  )
}
