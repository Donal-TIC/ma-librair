import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BoutonSupprimer from './BoutonSupprimer'

export default async function PageArticles({
  searchParams,
}: {
  searchParams: { recherche?: string; boutique?: string }
}) {
  const supabase = createClient()

  const { data: boutiques } = await supabase.from('boutiques').select('id, nom').eq('actif', true)

  let requete = supabase
    .from('articles')
    .select('id, nom, code_barre, prix_achat, prix_vente, quantite_stock, seuil_alerte, boutique_id, boutiques(nom)')
    .eq('actif', true)
    .order('nom')

  if (searchParams.boutique) requete = requete.eq('boutique_id', searchParams.boutique)
  if (searchParams.recherche) requete = requete.or(`nom.ilike.%${searchParams.recherche}%,code_barre.ilike.%${searchParams.recherche}%`)

  const { data: articles } = await requete

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Articles & stock</h2>
        <Link href="/admin/articles/nouveau" className="btn-primary text-center">+ Nouvel article</Link>
      </div>

      <form className="flex flex-col sm:flex-row gap-3 mb-4" method="get">
        <input
          name="recherche"
          defaultValue={searchParams.recherche}
          placeholder="Rechercher par nom ou code-barre..."
          className="input-field sm:max-w-xs"
        />
        <select name="boutique" defaultValue={searchParams.boutique ?? ''} className="input-field sm:max-w-xs">
          <option value="">Toutes les boutiques</option>
          {boutiques?.map((b) => (
            <option key={b.id} value={b.id}>{b.nom}</option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">Filtrer</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Article</th>
              <th className="pb-2">Code-barre</th>
              <th className="pb-2">Boutique</th>
              <th className="pb-2">Prix achat</th>
              <th className="pb-2">Prix vente</th>
              <th className="pb-2">Stock</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(articles ?? []).map((a: any) => {
              const stockBas = a.quantite_stock <= a.seuil_alerte
              return (
                <tr key={a.id}>
                  <td className="py-2 font-medium">{a.nom}</td>
                  <td className="py-2 text-gray-500 font-mono text-xs">{a.code_barre}</td>
                  <td className="py-2 text-gray-500">{a.boutiques?.nom}</td>
                  <td className="py-2">{Number(a.prix_achat).toLocaleString('fr-FR')} FCFA</td>
                  <td className="py-2">{Number(a.prix_vente).toLocaleString('fr-FR')} FCFA</td>
                  <td className="py-2">
                    <span className={stockBas ? 'text-red-600 font-semibold' : ''}>
                      {a.quantite_stock}{stockBas && ' ⚠️'}
                    </span>
                  </td>
                  <td className="py-2 text-right space-x-3">
                    <Link href={`/admin/articles/${a.id}`} className="text-primary-600 hover:underline">Modifier</Link>
                    <BoutonSupprimer articleId={a.id} />
                  </td>
                </tr>
              )
            })}
            {(!articles || articles.length === 0) && (
              <tr><td colSpan={7} className="py-6 text-center text-gray-400">Aucun article trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
