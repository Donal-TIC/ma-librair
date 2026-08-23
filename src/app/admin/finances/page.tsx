import { createClient } from '@/lib/supabase/server'
import GraphiqueFinances from '@/components/GraphiqueFinances'

function premierJourDuMois() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

function aujourdHui() {
  return new Date().toISOString().slice(0, 10)
}

export default async function PageFinances({
  searchParams,
}: {
  searchParams: { boutique?: string; debut?: string; fin?: string }
}) {
  const supabase = createClient()
  const debut = searchParams.debut || premierJourDuMois()
  const fin = searchParams.fin || aujourdHui()
  // On inclut toute la journée de fin
  const finInclusive = `${fin}T23:59:59`

  const { data: boutiques } = await supabase.from('boutiques').select('id, nom, budget_initial').eq('actif', true)

  let requeteVentes = supabase
    .from('ventes')
    .select('id, boutique_id, montant_total, created_at')
    .gte('created_at', debut)
    .lte('created_at', finInclusive)
  if (searchParams.boutique) requeteVentes = requeteVentes.eq('boutique_id', searchParams.boutique)
  const { data: ventes } = await requeteVentes

  let requeteDepenses = supabase
    .from('depenses')
    .select('id, boutique_id, motif, montant, created_at, boutiques(nom)')
    .gte('created_at', debut)
    .lte('created_at', finInclusive)
    .order('created_at', { ascending: false })
  if (searchParams.boutique) requeteDepenses = requeteDepenses.eq('boutique_id', searchParams.boutique)
  const { data: depenses } = await requeteDepenses

  let requetePertes = supabase
    .from('mouvements_stock')
    .select('id, boutique_id, quantite, motif, created_at, articles(nom, prix_achat), boutiques(nom)')
    .eq('type', 'perte')
    .gte('created_at', debut)
    .lte('created_at', finInclusive)
    .order('created_at', { ascending: false })
  if (searchParams.boutique) requetePertes = requetePertes.eq('boutique_id', searchParams.boutique)
  const { data: pertes } = await requetePertes

  // Coût des marchandises vendues (CMV) : on récupère les lignes de vente liées aux ventes de la période
  const idsVentes = (ventes ?? []).map((v) => v.id)
  let cmv = 0
  if (idsVentes.length > 0) {
    const { data: lignes } = await supabase
      .from('lignes_vente')
      .select('quantite, prix_achat_reference')
      .in('vente_id', idsVentes)
    cmv = (lignes ?? []).reduce((s, l) => s + l.quantite * Number(l.prix_achat_reference ?? 0), 0)
  }

  const chiffreAffaires = (ventes ?? []).reduce((s, v) => s + Number(v.montant_total), 0)
  const beneficeBrut = chiffreAffaires - cmv
  const totalDepenses = (depenses ?? []).reduce((s, d) => s + Number(d.montant), 0)
  const valeurPertes = (pertes ?? []).reduce((s: number, p: any) => s + p.quantite * Number(p.articles?.prix_achat ?? 0), 0)

  const budgetInitialTotal = searchParams.boutique
    ? Number(boutiques?.find((b) => b.id === searchParams.boutique)?.budget_initial ?? 0)
    : (boutiques ?? []).reduce((s, b) => s + Number(b.budget_initial), 0)
  const budgetActuel = budgetInitialTotal + beneficeBrut - totalDepenses - valeurPertes

  // Regroupement par jour pour le graphique (CA et dépenses)
  const parJour: Record<string, { ca: number; depenses: number }> = {}
  for (const v of ventes ?? []) {
    const jour = v.created_at.slice(0, 10)
    parJour[jour] = parJour[jour] ?? { ca: 0, depenses: 0 }
    parJour[jour].ca += Number(v.montant_total)
  }
  for (const d of depenses ?? []) {
    const jour = d.created_at.slice(0, 10)
    parJour[jour] = parJour[jour] ?? { ca: 0, depenses: 0 }
    parJour[jour].depenses += Number(d.montant)
  }
  const donneesGraphique = Object.entries(parJour)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([jour, v]) => ({ jour, ...v }))

  const cartes = [
    { label: "Chiffre d'affaires", valeur: chiffreAffaires, couleur: 'text-primary-700' },
    { label: 'Coût des marchandises vendues', valeur: cmv, couleur: 'text-gray-700' },
    { label: 'Bénéfice brut', valeur: beneficeBrut, couleur: beneficeBrut >= 0 ? 'text-green-600' : 'text-red-600' },
    { label: 'Dépenses', valeur: totalDepenses, couleur: 'text-orange-600' },
    { label: 'Valeur des pertes', valeur: valeurPertes, couleur: 'text-red-600' },
    { label: 'Budget actuel', valeur: budgetActuel, couleur: budgetActuel >= 0 ? 'text-primary-700' : 'text-red-600' },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Finances</h2>

      <form className="flex flex-col sm:flex-row gap-3 mb-6" method="get">
        <select name="boutique" defaultValue={searchParams.boutique ?? ''} className="input-field sm:max-w-xs">
          <option value="">Toutes les boutiques</option>
          {boutiques?.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
        </select>
        <input type="date" name="debut" defaultValue={debut} className="input-field sm:max-w-[160px]" />
        <input type="date" name="fin" defaultValue={fin} className="input-field sm:max-w-[160px]" />
        <button type="submit" className="btn-secondary">Filtrer</button>
      </form>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {cartes.map((c) => (
          <div key={c.label} className="card">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className={`text-lg sm:text-xl font-bold mt-1 ${c.couleur}`}>
              {c.valeur.toLocaleString('fr-FR')} FCFA
            </p>
          </div>
        ))}
      </div>

      <div className="card mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Chiffre d'affaires et dépenses par jour</h3>
        <GraphiqueFinances donnees={donneesGraphique} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Dépenses récentes</h3>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Motif</th>
                  <th className="pb-2">Boutique</th>
                  <th className="pb-2 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(depenses ?? []).slice(0, 20).map((d: any) => (
                  <tr key={d.id}>
                    <td className="py-2 text-gray-500 whitespace-nowrap">{new Date(d.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="py-2">{d.motif}</td>
                    <td className="py-2 text-gray-500">{d.boutiques?.nom}</td>
                    <td className="py-2 text-right">{Number(d.montant).toLocaleString('fr-FR')} FCFA</td>
                  </tr>
                ))}
                {(!depenses || depenses.length === 0) && (
                  <tr><td colSpan={4} className="py-6 text-center text-gray-400">Aucune dépense sur cette période.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Pertes récentes</h3>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Article</th>
                  <th className="pb-2">Qté</th>
                  <th className="pb-2 text-right">Valeur estimée</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(pertes ?? []).slice(0, 20).map((p: any) => (
                  <tr key={p.id}>
                    <td className="py-2 text-gray-500 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="py-2">{p.articles?.nom}</td>
                    <td className="py-2">{p.quantite}</td>
                    <td className="py-2 text-right text-red-600">
                      {(p.quantite * Number(p.articles?.prix_achat ?? 0)).toLocaleString('fr-FR')} FCFA
                    </td>
                  </tr>
                ))}
                {(!pertes || pertes.length === 0) && (
                  <tr><td colSpan={4} className="py-6 text-center text-gray-400">Aucune perte enregistrée sur cette période.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
