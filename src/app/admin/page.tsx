import { createClient } from '@/lib/supabase/server'

export default async function DashboardAdmin() {
  const supabase = createClient()

  const [{ count: nbArticles }, { count: nbBoutiques }, { data: ventesJour }] = await Promise.all([
    supabase.from('articles').select('*', { count: 'exact', head: true }),
    supabase.from('boutiques').select('*', { count: 'exact', head: true }),
    supabase
      .from('ventes')
      .select('montant_total')
      .gte('created_at', new Date().toISOString().slice(0, 10)),
  ])

  const totalVentesJour = (ventesJour ?? []).reduce((s, v) => s + Number(v.montant_total), 0)

  const cartes = [
    { label: 'Boutiques actives', valeur: nbBoutiques ?? 0 },
    { label: 'Articles en catalogue', valeur: nbArticles ?? 0 },
    { label: "Ventes du jour", valeur: `${totalVentesJour.toLocaleString('fr-FR')} FCFA` },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Tableau de bord</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cartes.map((c) => (
          <div key={c.label} className="card">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="text-2xl font-bold text-primary-700 mt-1">{c.valeur}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-400 mt-8">
        Les sections « Boutiques », « Articles », « Stock » et « Finances » se complètent dans les prochaines étapes.
      </p>
    </div>
  )
}
