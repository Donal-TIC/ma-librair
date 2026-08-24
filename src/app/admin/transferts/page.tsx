import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { IconeTransfert } from '@/components/icones'

const libellesStatut: Record<string, { label: string; couleur: string }> = {
  expedie: { label: 'Expédié', couleur: 'text-orange-600' },
  partiellement_recu: { label: 'Partiellement reçu', couleur: 'text-orange-600' },
  recu: { label: 'Reçu', couleur: 'text-green-600' },
  annule: { label: 'Annulé', couleur: 'text-gray-400' },
}

export default async function PageTransferts() {
  const supabase = createClient()

  const { data: transferts } = await supabase
    .from('transferts')
    .select('id, numero, statut, created_at, source:boutique_source_id(nom), destination:boutique_destination_id(nom)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <IconeTransfert className="w-6 h-6" /> Transferts entre boutiques
        </h2>
        <Link href="/admin/transferts/nouveau" className="btn-primary text-center">+ Nouveau transfert</Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Numéro</th><th className="pb-2">De</th><th className="pb-2">Vers</th>
              <th className="pb-2">Date</th><th className="pb-2">Statut</th><th className="pb-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(transferts ?? []).map((t: any) => (
              <tr key={t.id}>
                <td className="py-2 font-mono text-xs">{t.numero}</td>
                <td className="py-2">{t.source?.nom}</td>
                <td className="py-2">{t.destination?.nom}</td>
                <td className="py-2 text-gray-500">{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
                <td className={`py-2 ${libellesStatut[t.statut]?.couleur}`}>{libellesStatut[t.statut]?.label ?? t.statut}</td>
                <td className="py-2 text-right"><Link href={`/admin/transferts/${t.id}`} className="text-primary-600 hover:underline">Voir</Link></td>
              </tr>
            ))}
            {(!transferts || transferts.length === 0) && (
              <tr><td colSpan={6} className="py-6 text-center text-gray-400">Aucun transfert enregistré.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
