import { createClient } from '@/lib/supabase/server'
import BoutonImprimer from '@/components/BoutonImprimer'

function aujourdHui() {
  return new Date().toISOString().slice(0, 10)
}

export default async function RapportJournalier({ searchParams }: { searchParams: { date?: string; boutique?: string } }) {
  const supabase = createClient()
  const date = searchParams.date || aujourdHui()
  const debut = `${date}T00:00:00`
  const fin = `${date}T23:59:59`

  const { data: boutiques } = await supabase.from('boutiques').select('id, nom').eq('actif', true)

  let requeteVentes = supabase
    .from('ventes')
    .select('id, montant_total, annulee, caissier_id, boutique_id, paiements_vente(mode, montant), lignes_vente(quantite, prix_achat_reference), boutiques(nom), profils:caissier_id(nom_complet)')
    .gte('created_at', debut).lte('created_at', fin)
  if (searchParams.boutique) requeteVentes = requeteVentes.eq('boutique_id', searchParams.boutique)
  const { data: ventes } = await requeteVentes

  let requeteDepenses = supabase.from('depenses').select('motif, montant, boutiques(nom)').gte('created_at', debut).lte('created_at', fin)
  if (searchParams.boutique) requeteDepenses = requeteDepenses.eq('boutique_id', searchParams.boutique)
  const { data: depenses } = await requeteDepenses

  let requetePertes = supabase.from('mouvements_stock').select('quantite, articles(nom, prix_achat)').eq('type', 'perte').gte('created_at', debut).lte('created_at', fin)
  if (searchParams.boutique) requetePertes = requetePertes.eq('boutique_id', searchParams.boutique)
  const { data: pertes } = await requetePertes

  let requeteSessions = supabase.from('sessions_caisse').select('id, fond_initial, montant_theorique, montant_compte, ecart, statut, ouverte_at, fermee_at, boutiques(nom), profils:caissier_id(nom_complet)').gte('ouverte_at', debut).lte('ouverte_at', fin)
  if (searchParams.boutique) requeteSessions = requeteSessions.eq('boutique_id', searchParams.boutique)
  const { data: sessions } = await requeteSessions

  const ventesValides = (ventes ?? []).filter((v: any) => !v.annulee)
  const chiffreAffaires = ventesValides.reduce((s: number, v: any) => s + Number(v.montant_total), 0)
  const cmv = ventesValides.reduce((s: number, v: any) => s + (v.lignes_vente ?? []).reduce((s2: number, l: any) => s2 + l.quantite * Number(l.prix_achat_reference ?? 0), 0), 0)
  const benefice = chiffreAffaires - cmv
  const nombreVentes = ventesValides.length
  const nombreAnnulations = (ventes ?? []).length - nombreVentes

  const paiements = ventesValides.flatMap((v: any) => v.paiements_vente ?? [])
  const parMode = (mode: string) => paiements.filter((p: any) => p.mode === mode).reduce((s: number, p: any) => s + Number(p.montant), 0)

  const totalDepenses = (depenses ?? []).reduce((s, d) => s + Number(d.montant), 0)
  const valeurPertes = (pertes ?? []).reduce((s: number, p: any) => s + p.quantite * Number(p.articles?.prix_achat ?? 0), 0)

  const indicateurs = [
    { label: "Chiffre d'affaires", valeur: chiffreAffaires },
    { label: 'Bénéfice brut', valeur: benefice },
    { label: 'Espèces encaissées', valeur: parMode('especes') },
    { label: 'Carte', valeur: parMode('carte') },
    { label: 'Mobile Money', valeur: parMode('mobile_money') },
    { label: 'Dépenses', valeur: totalDepenses },
    { label: 'Valeur des pertes', valeur: valeurPertes },
  ]

  return (
    <div className="max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 print:hidden">
        <h2 className="text-2xl font-bold text-gray-800">Rapport de fin de journée</h2>
        <BoutonImprimer />
      </div>

      <form method="get" className="flex gap-3 mb-6 print:hidden">
        <select name="boutique" defaultValue={searchParams.boutique ?? ''} className="input-field max-w-xs">
          <option value="">Toutes les boutiques</option>
          {boutiques?.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
        </select>
        <input type="date" name="date" defaultValue={date} className="input-field max-w-[160px]" />
        <button type="submit" className="btn-secondary">Voir</button>
      </form>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Ma librair — Rapport journalier</h1>
        <p className="text-gray-500 text-sm">{new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {indicateurs.map((i) => (
          <div key={i.label} className="card">
            <p className="text-xs text-gray-500">{i.label}</p>
            <p className="text-lg font-bold text-primary-700 mt-1">{i.valeur.toLocaleString('fr-FR')} FCFA</p>
          </div>
        ))}
        <div className="card">
          <p className="text-xs text-gray-500">Tickets / Annulations</p>
          <p className="text-lg font-bold text-primary-700 mt-1">{nombreVentes} / {nombreAnnulations}</p>
        </div>
      </div>

      <h3 className="font-semibold text-gray-800 mb-2">Sessions de caisse de la journée</h3>
      <div className="card overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Boutique</th><th className="pb-2">Caissier</th><th className="pb-2">Fond initial</th>
              <th className="pb-2">Théorique</th><th className="pb-2">Compté</th><th className="pb-2">Écart</th><th className="pb-2">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(sessions ?? []).map((s: any) => (
              <tr key={s.id}>
                <td className="py-2">{s.boutiques?.nom}</td>
                <td className="py-2">{s.profils?.nom_complet}</td>
                <td className="py-2">{Number(s.fond_initial).toLocaleString('fr-FR')}</td>
                <td className="py-2">{s.montant_theorique !== null ? Number(s.montant_theorique).toLocaleString('fr-FR') : '—'}</td>
                <td className="py-2">{s.montant_compte !== null ? Number(s.montant_compte).toLocaleString('fr-FR') : '—'}</td>
                <td className={`py-2 ${s.ecart && s.ecart !== 0 ? (s.ecart > 0 ? 'text-orange-600' : 'text-red-600') : ''}`}>
                  {s.ecart !== null ? Number(s.ecart).toLocaleString('fr-FR') : '—'}
                </td>
                <td className="py-2">{s.statut === 'ouverte' ? 'Ouverte' : 'Fermée'}</td>
              </tr>
            ))}
            {(!sessions || sessions.length === 0) && <tr><td colSpan={7} className="py-4 text-center text-gray-400">Aucune session ce jour.</td></tr>}
          </tbody>
        </table>
      </div>

      <h3 className="font-semibold text-gray-800 mb-2">Dépenses de la journée</h3>
      <div className="card overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Motif</th><th className="pb-2">Boutique</th><th className="pb-2 text-right">Montant</th></tr></thead>
          <tbody className="divide-y">
            {(depenses ?? []).map((d: any, i: number) => (
              <tr key={i}><td className="py-2">{d.motif}</td><td className="py-2 text-gray-500">{d.boutiques?.nom}</td><td className="py-2 text-right">{Number(d.montant).toLocaleString('fr-FR')} FCFA</td></tr>
            ))}
            {(!depenses || depenses.length === 0) && <tr><td colSpan={3} className="py-4 text-center text-gray-400">Aucune dépense ce jour.</td></tr>}
          </tbody>
        </table>
      </div>

      <h3 className="font-semibold text-gray-800 mb-2">Pertes de la journée</h3>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Article</th><th className="pb-2">Quantité</th><th className="pb-2 text-right">Valeur</th></tr></thead>
          <tbody className="divide-y">
            {(pertes ?? []).map((p: any, i: number) => (
              <tr key={i}><td className="py-2">{p.articles?.nom}</td><td className="py-2">{p.quantite}</td><td className="py-2 text-right text-red-600">{(p.quantite * Number(p.articles?.prix_achat ?? 0)).toLocaleString('fr-FR')} FCFA</td></tr>
            ))}
            {(!pertes || pertes.length === 0) && <tr><td colSpan={3} className="py-4 text-center text-gray-400">Aucune perte ce jour.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
