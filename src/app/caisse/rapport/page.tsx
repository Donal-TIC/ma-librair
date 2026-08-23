import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function aujourdHui() {
  return new Date().toISOString().slice(0, 10)
}

export default async function PageRapport({ searchParams }: { searchParams: { date?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/caissier')

  const date = searchParams.date || aujourdHui()
  const debut = `${date}T00:00:00`
  const fin = `${date}T23:59:59`

  const { data: ventes } = await supabase
    .from('ventes')
    .select('id, montant_total, annulee, paiements_vente(mode, montant)')
    .eq('caissier_id', user.id)
    .gte('created_at', debut)
    .lte('created_at', fin)

  const { data: depenses } = await supabase
    .from('depenses')
    .select('montant')
    .eq('effectue_par', user.id)
    .gte('created_at', debut)
    .lte('created_at', fin)

  const ventesValides = (ventes ?? []).filter((v) => !v.annulee)
  const ventesAnnulees = (ventes ?? []).filter((v) => v.annulee).length

  const totalVentes = ventesValides.reduce((s, v) => s + Number(v.montant_total), 0)
  const paiements = ventesValides.flatMap((v: any) => v.paiements_vente ?? [])
  const parMode = (mode: string) => paiements.filter((p: any) => p.mode === mode).reduce((s: number, p: any) => s + Number(p.montant), 0)

  const totalDepenses = (depenses ?? []).reduce((s, d) => s + Number(d.montant), 0)

  const lignes = [
    { label: 'Nombre de tickets', valeur: `${ventesValides.length}` },
    { label: 'Chiffre d\'affaires', valeur: `${totalVentes.toLocaleString('fr-FR')} FCFA` },
    { label: 'Dont espèces', valeur: `${parMode('especes').toLocaleString('fr-FR')} FCFA` },
    { label: 'Dont carte', valeur: `${parMode('carte').toLocaleString('fr-FR')} FCFA` },
    { label: 'Dont Mobile Money', valeur: `${parMode('mobile_money').toLocaleString('fr-FR')} FCFA` },
    { label: 'Dépenses', valeur: `${totalDepenses.toLocaleString('fr-FR')} FCFA` },
    { label: 'Ventes annulées', valeur: `${ventesAnnulees}` },
  ]

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Rapport journalier</h2>

      <form method="get" className="flex gap-2 mb-4">
        <input type="date" name="date" defaultValue={date} className="input-field" />
        <button type="submit" className="btn-secondary">Voir</button>
      </form>

      <div className="card divide-y">
        {lignes.map((l) => (
          <div key={l.label} className="flex justify-between py-2 text-sm">
            <span className="text-gray-500">{l.label}</span>
            <span className="font-medium">{l.valeur}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">
        Ce rapport ne montre que vos propres ventes de la journée. Pour la vue complète (toutes boutiques, bénéfices), voir l'espace administrateur.
      </p>
    </div>
  )
}
