import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FormulaireReception from './FormulaireReception'

export default async function DetailTransfert({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: transfert } = await supabase
    .from('transferts')
    .select('id, numero, statut, created_at, recu_at, source:boutique_source_id(nom), destination:boutique_destination_id(nom)')
    .eq('id', params.id)
    .single()
  if (!transfert) notFound()

  const { data: lignes } = await supabase
    .from('transferts_lignes')
    .select('id, nom_article, quantite_envoyee, quantite_recue')
    .eq('transfert_id', params.id)

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-1">Transfert {transfert.numero}</h2>
      <p className="text-gray-500 text-sm mb-6">
        {(transfert as any).source?.nom} → {(transfert as any).destination?.nom} · {new Date(transfert.created_at).toLocaleDateString('fr-FR')}
      </p>

      <div className="card divide-y mb-6">
        {(lignes ?? []).map((l) => (
          <div key={l.id} className="flex justify-between py-2 text-sm">
            <span>{l.nom_article}</span>
            <span className="text-gray-500">
              Envoyé : {l.quantite_envoyee} {l.quantite_recue !== null && `· Reçu : ${l.quantite_recue}`}
            </span>
          </div>
        ))}
      </div>

      {transfert.statut === 'recu' ? (
        <p className="text-green-600 text-sm">✓ Transfert entièrement reçu le {new Date(transfert.recu_at!).toLocaleDateString('fr-FR')}</p>
      ) : (
        <FormulaireReception transfertId={transfert.id} lignes={lignes ?? []} />
      )}
    </div>
  )
}
