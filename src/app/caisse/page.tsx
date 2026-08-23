import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { IconePanier, IconeUtilisateurs, IconeStock, IconeDepense, IconeFinances, IconeMoins } from '@/components/icones'

export default async function TableauDeBordCaisse() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/caissier')

  const { data: session } = await supabase
    .from('sessions_caisse')
    .select('id, fond_initial, ouverte_at')
    .eq('caissier_id', user.id)
    .eq('statut', 'ouverte')
    .maybeSingle()

  if (!session) redirect('/caisse/ouverture')

  const { data: ventesJour } = await supabase
    .from('ventes')
    .select('id, montant_total, annulee, lignes_vente(quantite)')
    .eq('session_id', session.id)

  const ventesValides = (ventesJour ?? []).filter((v) => !v.annulee)
  const montantEncaisse = ventesValides.reduce((s, v) => s + Number(v.montant_total), 0)
  const nombreVentes = ventesValides.length
  const produitsVendus = ventesValides.reduce((s: number, v: any) => s + (v.lignes_vente ?? []).reduce((s2: number, l: any) => s2 + l.quantite, 0), 0)

  const cartes = [
    { label: 'Montant encaissé', valeur: `${montantEncaisse.toLocaleString('fr-FR')} FCFA` },
    { label: 'Nombre de ventes', valeur: nombreVentes },
    { label: 'Produits vendus', valeur: produitsVendus },
    { label: 'Fond de caisse', valeur: `${Number(session.fond_initial).toLocaleString('fr-FR')} FCFA` },
  ]

  const raccourcis = [
    { href: '/caisse/vente', label: 'Nouvelle vente', Icone: IconePanier },
    { href: '/caisse/clients', label: 'Clients', Icone: IconeUtilisateurs },
    { href: '/caisse/historique', label: 'Historique', Icone: IconeStock },
    { href: '/caisse/retours', label: 'Retours', Icone: IconeMoins },
    { href: '/caisse/depenses', label: 'Dépenses', Icone: IconeDepense },
    { href: '/caisse/rapport', label: 'Rapport du jour', Icone: IconeFinances },
    { href: '/caisse/fermeture', label: 'Fermer la caisse', Icone: IconeFinances },
    { href: '/caisse/mot-de-passe', label: 'Mot de passe', Icone: IconeUtilisateurs },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">Tableau de bord</h2>
      <p className="text-gray-500 text-sm mb-6">
        Session ouverte depuis {new Date(session.ouverte_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {cartes.map((c) => (
          <div key={c.label} className="card">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-lg font-bold text-primary-700 mt-1">{c.valeur}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {raccourcis.map((r) => (
          <Link key={r.href} href={r.href} className="card flex flex-col items-center justify-center gap-2 py-6 hover:border-primary-300 transition-colors text-center">
            <r.Icone className="w-6 h-6 text-primary-600" />
            <span className="text-sm font-medium text-gray-700">{r.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
