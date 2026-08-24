import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import LigneInventaire from './LigneInventaire'
import BoutonCloturer from './BoutonCloturer'

export default async function DetailInventaire({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: inventaire } = await supabase
    .from('inventaires')
    .select('id, numero, statut, created_at, termine_at, boutiques(nom)')
    .eq('id', params.id)
    .single()
  if (!inventaire) notFound()

  const { data: lignes } = await supabase
    .from('inventaires_lignes')
    .select('id, nom_article, stock_theorique, stock_compte, ecart, justification')
    .eq('inventaire_id', params.id)
    .order('nom_article')

  const nombreComptees = (lignes ?? []).filter((l) => l.stock_compte !== null).length
  const nombreEcarts = (lignes ?? []).filter((l) => l.ecart !== null && l.ecart !== 0).length

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-1">Inventaire {inventaire.numero}</h2>
      <p className="text-gray-500 text-sm mb-6">
        {(inventaire as any).boutiques?.nom} · {new Date(inventaire.created_at).toLocaleDateString('fr-FR')} ·
        {' '}{nombreComptees}/{lignes?.length ?? 0} articles comptés
        {nombreEcarts > 0 && <span className="text-orange-600"> · {nombreEcarts} écart(s)</span>}
      </p>

      {inventaire.statut === 'termine' ? (
        <p className="text-green-600 text-sm mb-4">✓ Inventaire clôturé le {new Date(inventaire.termine_at!).toLocaleDateString('fr-FR')}, le stock a été corrigé.</p>
      ) : (
        <BoutonCloturer inventaireId={inventaire.id} />
      )}

      <div className="card divide-y mt-4">
        {(lignes ?? []).map((l) => (
          <LigneInventaire key={l.id} ligne={l} verrouille={inventaire.statut === 'termine'} />
        ))}
      </div>
    </div>
  )
}
