import { createClient } from '@/lib/supabase/server'
import FormulaireAjustement from './FormulaireAjustement'

const libellesType: Record<string, string> = {
  entree: 'Entrée',
  sortie: 'Sortie',
  vente: 'Vente',
  perte: 'Perte',
  correction: 'Correction',
  retour: 'Retour',
}

export default async function PageStock({
  searchParams,
}: {
  searchParams: { boutique?: string; type?: string }
}) {
  const supabase = createClient()

  const [{ data: boutiques }, { data: articles }] = await Promise.all([
    supabase.from('boutiques').select('id, nom').eq('actif', true),
    supabase.from('articles').select('id, nom, boutique_id, code_barre').eq('actif', true),
  ])

  let requete = supabase
    .from('mouvements_stock')
    .select('id, type, quantite, quantite_avant, quantite_apres, motif, created_at, articles(nom, code_barre), boutiques(nom)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (searchParams.boutique) requete = requete.eq('boutique_id', searchParams.boutique)
  if (searchParams.type) requete = requete.eq('type', searchParams.type)

  const { data: mouvements } = await requete

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Mouvements de stock</h2>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <form className="flex flex-col sm:flex-row gap-3 mb-4" method="get">
            <select name="boutique" defaultValue={searchParams.boutique ?? ''} className="input-field sm:max-w-xs">
              <option value="">Toutes les boutiques</option>
              {boutiques?.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
            </select>
            <select name="type" defaultValue={searchParams.type ?? ''} className="input-field sm:max-w-xs">
              <option value="">Tous les types</option>
              {Object.entries(libellesType).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
            <button type="submit" className="btn-secondary">Filtrer</button>
          </form>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Article</th>
                  <th className="pb-2">Boutique</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Quantité</th>
                  <th className="pb-2">Stock (avant → après)</th>
                  <th className="pb-2">Motif</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(mouvements ?? []).map((m: any) => (
                  <tr key={m.id}>
                    <td className="py-2 text-gray-500 whitespace-nowrap">
                      {new Date(m.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-2 font-medium">{m.articles?.nom}</td>
                    <td className="py-2 text-gray-500">{m.boutiques?.nom}</td>
                    <td className="py-2">
                      <span className={
                        m.type === 'entree' ? 'text-green-600' :
                        m.type === 'perte' ? 'text-red-600' :
                        'text-gray-600'
                      }>
                        {libellesType[m.type] ?? m.type}
                      </span>
                    </td>
                    <td className="py-2">{m.quantite}</td>
                    <td className="py-2 text-gray-500">{m.quantite_avant} → {m.quantite_apres}</td>
                    <td className="py-2 text-gray-500">{m.motif ?? '—'}</td>
                  </tr>
                ))}
                {(!mouvements || mouvements.length === 0) && (
                  <tr><td colSpan={7} className="py-6 text-center text-gray-400">Aucun mouvement enregistré.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Ajustement manuel</h3>
          <FormulaireAjustement articles={articles ?? []} />
        </div>
      </div>
    </div>
  )
}
