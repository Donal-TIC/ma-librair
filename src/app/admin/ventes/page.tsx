import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BoutonExporterCSV from '@/components/BoutonExporterCSV'

function premierJourDuMois() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
function aujourdHui() {
  return new Date().toISOString().slice(0, 10)
}

export default async function PageVentesAdmin({
  searchParams,
}: {
  searchParams: { boutique?: string; debut?: string; fin?: string; paiement?: string }
}) {
  const supabase = createClient()
  const debut = searchParams.debut || premierJourDuMois()
  const fin = searchParams.fin || aujourdHui()
  const finInclusive = `${fin}T23:59:59`

  const { data: boutiques } = await supabase.from('boutiques').select('id, nom').eq('actif', true)

  let requete = supabase
    .from('ventes')
    .select('id, numero_recu, montant_total, annulee, created_at, boutiques(nom), profils:caissier_id(nom_complet), clients(nom), paiements_vente(mode, montant)')
    .gte('created_at', debut)
    .lte('created_at', finInclusive)
    .order('created_at', { ascending: false })
    .limit(200)
  if (searchParams.boutique) requete = requete.eq('boutique_id', searchParams.boutique)
  const { data: ventes } = await requete

  const ventesFiltrees = searchParams.paiement
    ? (ventes ?? []).filter((v: any) => (v.paiements_vente ?? []).some((p: any) => p.mode === searchParams.paiement))
    : (ventes ?? [])

  const donneesExport = ventesFiltrees.map((v: any) => ({
    numero: v.numero_recu,
    date: new Date(v.created_at).toLocaleString('fr-FR'),
    boutique: v.boutiques?.nom ?? '',
    caissier: v.profils?.nom_complet ?? '',
    client: v.clients?.nom ?? '',
    total: v.montant_total,
    statut: v.annulee ? 'Annulée' : 'Validée',
  }))

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Ventes</h2>
        <BoutonExporterCSV donnees={donneesExport} nomFichier="ventes" />
      </div>

      <form className="flex flex-col sm:flex-row gap-3 mb-4" method="get">
        <select name="boutique" defaultValue={searchParams.boutique ?? ''} className="input-field sm:max-w-[180px]">
          <option value="">Toutes les boutiques</option>
          {boutiques?.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
        </select>
        <select name="paiement" defaultValue={searchParams.paiement ?? ''} className="input-field sm:max-w-[160px]">
          <option value="">Tous les paiements</option>
          <option value="especes">Espèces</option>
          <option value="carte">Carte</option>
          <option value="mobile_money">Mobile Money</option>
        </select>
        <input type="date" name="debut" defaultValue={debut} className="input-field sm:max-w-[150px]" />
        <input type="date" name="fin" defaultValue={fin} className="input-field sm:max-w-[150px]" />
        <button type="submit" className="btn-secondary">Filtrer</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Numéro</th><th className="pb-2">Date</th><th className="pb-2">Boutique</th>
              <th className="pb-2">Caissier</th><th className="pb-2">Client</th><th className="pb-2">Total</th><th className="pb-2">Statut</th><th className="pb-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {ventesFiltrees.map((v: any) => (
              <tr key={v.id}>
                <td className="py-2 font-mono text-xs">{v.numero_recu}</td>
                <td className="py-2 text-gray-500 whitespace-nowrap">{new Date(v.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td className="py-2">{v.boutiques?.nom}</td>
                <td className="py-2 text-gray-500">{v.profils?.nom_complet ?? '—'}</td>
                <td className="py-2 text-gray-500">{v.clients?.nom ?? '—'}</td>
                <td className={`py-2 font-medium ${v.annulee ? 'line-through text-gray-400' : ''}`}>{Number(v.montant_total).toLocaleString('fr-FR')} FCFA</td>
                <td className="py-2">{v.annulee ? <span className="text-red-500">Annulée</span> : <span className="text-green-600">Validée</span>}</td>
                <td className="py-2 text-right"><Link href={`/admin/ventes/${v.id}`} className="text-primary-600 hover:underline">Détail</Link></td>
              </tr>
            ))}
            {ventesFiltrees.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-gray-400">Aucune vente sur cette période.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
