import { createClient } from '@/lib/supabase/server'
import { IconeStock } from '@/components/icones'

export default async function StockGlobal({ searchParams }: { searchParams: { recherche?: string } }) {
  const supabase = createClient()

  let requete = supabase
    .from('articles')
    .select('nom, code_barre, quantite_stock, prix_achat, boutiques(nom)')
    .eq('actif', true)
    .order('nom')
  if (searchParams.recherche) requete = requete.ilike('nom', `%${searchParams.recherche}%`)
  const { data: articles } = await requete

  // Regroupement par nom d'article (même livre présent dans plusieurs boutiques)
  const groupes = new Map<string, { nom: string; total: number; valeur: number; parBoutique: { boutique: string; quantite: number }[] }>()
  for (const a of articles ?? []) {
    const existant = groupes.get(a.nom)
    const boutiqueNom = (a as any).boutiques?.nom ?? '—'
    if (existant) {
      existant.total += a.quantite_stock
      existant.valeur += a.quantite_stock * Number(a.prix_achat)
      existant.parBoutique.push({ boutique: boutiqueNom, quantite: a.quantite_stock })
    } else {
      groupes.set(a.nom, {
        nom: a.nom,
        total: a.quantite_stock,
        valeur: a.quantite_stock * Number(a.prix_achat),
        parBoutique: [{ boutique: boutiqueNom, quantite: a.quantite_stock }],
      })
    }
  }
  const lignes = Array.from(groupes.values()).sort((a, b) => a.nom.localeCompare(b.nom))
  const valeurTotaleStock = lignes.reduce((s, l) => s + l.valeur, 0)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <IconeStock className="w-6 h-6" /> Stock global (toutes boutiques)
        </h2>
        <div className="card px-4 py-2">
          <p className="text-xs text-gray-500">Valeur totale du stock</p>
          <p className="text-lg font-bold text-primary-700">{valeurTotaleStock.toLocaleString('fr-FR')} FCFA</p>
        </div>
      </div>

      <form className="mb-4" method="get">
        <input name="recherche" defaultValue={searchParams.recherche} placeholder="Rechercher un article..." className="input-field max-w-xs" />
      </form>

      <div className="card divide-y">
        {lignes.map((l) => (
          <details key={l.nom} className="py-2">
            <summary className="flex justify-between items-center cursor-pointer text-sm">
              <span className="font-medium">{l.nom}</span>
              <span className="text-gray-600">
                Stock total : <span className="font-semibold text-primary-700">{l.total}</span>
                {' · '}{l.valeur.toLocaleString('fr-FR')} FCFA
              </span>
            </summary>
            <div className="mt-2 pl-4 space-y-1">
              {l.parBoutique.map((b, i) => (
                <div key={i} className="flex justify-between text-xs text-gray-500">
                  <span>{b.boutique}</span>
                  <span>{b.quantite} unité(s)</span>
                </div>
              ))}
            </div>
          </details>
        ))}
        {lignes.length === 0 && <p className="text-gray-400 text-sm py-6 text-center">Aucun article trouvé.</p>}
      </div>
    </div>
  )
}
