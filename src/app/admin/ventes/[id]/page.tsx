import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

const libellesPaiement: Record<string, string> = { especes: 'Espèces', carte: 'Carte', mobile_money: 'Mobile Money' }

export default async function DetailVente({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: vente } = await supabase
    .from('ventes')
    .select('id, numero_recu, montant_total, montant_paye, monnaie_rendue, annulee, created_at, boutiques(nom), profils:caissier_id(nom_complet), clients(nom, telephone)')
    .eq('id', params.id)
    .single()
  if (!vente) notFound()

  const [{ data: lignes }, { data: paiements }] = await Promise.all([
    supabase.from('lignes_vente').select('nom_article, prix_unitaire, quantite, sous_total, est_gros').eq('vente_id', params.id),
    supabase.from('paiements_vente').select('mode, montant').eq('vente_id', params.id),
  ])

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-1">Vente {vente.numero_recu}</h2>
      <p className="text-gray-500 text-sm mb-6">
        {(vente as any).boutiques?.nom} · {new Date(vente.created_at).toLocaleString('fr-FR')} · Caissier : {(vente as any).profils?.nom_complet ?? '—'}
        {(vente as any).clients?.nom && <> · Client : {(vente as any).clients.nom}</>}
        {vente.annulee && <span className="text-red-500 font-medium"> · ANNULÉE</span>}
      </p>

      <div className="card divide-y mb-4">
        {(lignes ?? []).map((l, i) => (
          <div key={i} className="flex justify-between py-2 text-sm">
            <span>{l.nom_article} × {l.quantite} {l.est_gros && <span className="text-primary-600 text-xs">(gros)</span>}</span>
            <span className="font-medium">{Number(l.sous_total).toLocaleString('fr-FR')} FCFA</span>
          </div>
        ))}
        <div className="flex justify-between py-2 text-sm font-bold">
          <span>Total</span><span>{Number(vente.montant_total).toLocaleString('fr-FR')} FCFA</span>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-700 text-sm mb-2">Paiement</h3>
        {(paiements ?? []).map((p, i) => (
          <div key={i} className="flex justify-between text-sm py-1">
            <span className="text-gray-500">{libellesPaiement[p.mode] ?? p.mode}</span>
            <span>{Number(p.montant).toLocaleString('fr-FR')} FCFA</span>
          </div>
        ))}
        <div className="flex justify-between text-sm py-1 text-gray-500">
          <span>Monnaie rendue</span><span>{Number(vente.monnaie_rendue).toLocaleString('fr-FR')} FCFA</span>
        </div>
      </div>
    </div>
  )
}
