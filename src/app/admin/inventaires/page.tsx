import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { IconeInventaire } from '@/components/icones'
import BoutonLancerInventaire from './BoutonLancerInventaire'

export default async function PageInventaires() {
  const supabase = createClient()

  const { data: boutiques } = await supabase.from('boutiques').select('id, nom').eq('actif', true)
  const { data: inventaires } = await supabase
    .from('inventaires')
    .select('id, numero, statut, created_at, termine_at, boutiques(nom)')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <IconeInventaire className="w-6 h-6" /> Inventaires
        </h2>
        <BoutonLancerInventaire boutiques={boutiques ?? []} />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Numéro</th><th className="pb-2">Boutique</th><th className="pb-2">Date</th><th className="pb-2">Statut</th><th className="pb-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(inventaires ?? []).map((i: any) => (
              <tr key={i.id}>
                <td className="py-2 font-mono text-xs">{i.numero}</td>
                <td className="py-2">{i.boutiques?.nom}</td>
                <td className="py-2 text-gray-500">{new Date(i.created_at).toLocaleDateString('fr-FR')}</td>
                <td className={`py-2 ${i.statut === 'termine' ? 'text-green-600' : 'text-orange-600'}`}>
                  {i.statut === 'termine' ? 'Terminé' : 'En cours'}
                </td>
                <td className="py-2 text-right"><Link href={`/admin/inventaires/${i.id}`} className="text-primary-600 hover:underline">Voir</Link></td>
              </tr>
            ))}
            {(!inventaires || inventaires.length === 0) && (
              <tr><td colSpan={5} className="py-6 text-center text-gray-400">Aucun inventaire lancé.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
