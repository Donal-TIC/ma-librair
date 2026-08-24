import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import GraphiqueVentesJour from '@/components/GraphiqueVentesJour'
import { IconeAlerte } from '@/components/icones'

function debutJournee(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString() }
function debutSemaine(d: Date) {
  const jour = d.getDay() === 0 ? 7 : d.getDay() // lundi = début de semaine
  const lundi = new Date(d)
  lundi.setDate(d.getDate() - jour + 1)
  return debutJournee(lundi)
}
function debutMois(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1).toISOString() }
function debutAnnee(d: Date) { return new Date(d.getFullYear(), 0, 1).toISOString() }

export default async function DashboardAdmin({ searchParams }: { searchParams: { boutique?: string } }) {
  const supabase = createClient()
  const maintenant = new Date()

  const [{ data: boutiques }, { count: nbBoutiques }, { count: nbClients }, { count: sessionsOuvertes }] = await Promise.all([
    supabase.from('boutiques').select('id, nom').eq('actif', true),
    supabase.from('boutiques').select('*', { count: 'exact', head: true }).eq('actif', true),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('sessions_caisse').select('*', { count: 'exact', head: true }).eq('statut', 'ouverte'),
  ])

  let requeteArticles = supabase.from('articles').select('id, nom, quantite_stock, seuil_alerte, prix_achat, boutique_id').eq('actif', true)
  if (searchParams.boutique) requeteArticles = requeteArticles.eq('boutique_id', searchParams.boutique)
  const { data: articles } = await requeteArticles

  let requeteVentesAnnee = supabase
    .from('ventes')
    .select('id, montant_total, created_at, boutique_id, annulee, boutiques(nom), lignes_vente(nom_article, quantite, sous_total)')
    .gte('created_at', debutAnnee(maintenant))
  if (searchParams.boutique) requeteVentesAnnee = requeteVentesAnnee.eq('boutique_id', searchParams.boutique)
  const { data: ventesAnnee } = await requeteVentesAnnee

  let requeteAchatsMois = supabase.from('achats').select('montant_total, boutique_id').gte('created_at', debutMois(maintenant)).neq('statut', 'annulee')
  if (searchParams.boutique) requeteAchatsMois = requeteAchatsMois.eq('boutique_id', searchParams.boutique)
  const { data: achatsMois } = await requeteAchatsMois

  let requeteDepensesMois = supabase.from('depenses').select('montant, boutique_id').gte('created_at', debutMois(maintenant))
  if (searchParams.boutique) requeteDepensesMois = requeteDepensesMois.eq('boutique_id', searchParams.boutique)
  const { data: depensesMois } = await requeteDepensesMois

  const ventesValides = (ventesAnnee ?? []).filter((v) => !v.annulee)
  const sommeSur = (depuis: string) => ventesValides.filter((v) => v.created_at >= depuis).reduce((s, v) => s + Number(v.montant_total), 0)

  const caJour = sommeSur(debutJournee(maintenant))
  const caSemaine = sommeSur(debutSemaine(maintenant))
  const caMois = sommeSur(debutMois(maintenant))
  const caAnnee = sommeSur(debutAnnee(maintenant))

  const ventesMois = ventesValides.filter((v) => v.created_at >= debutMois(maintenant))
  const cmvMois = ventesMois.reduce((s: number, v: any) => s + (v.lignes_vente ?? []).reduce((s2: number, l: any) => s2 + Number(l.sous_total) - 0, 0), 0)
  const totalAchatsMois = (achatsMois ?? []).reduce((s, a) => s + Number(a.montant_total), 0)
  const totalDepensesMois = (depensesMois ?? []).reduce((s, d) => s + Number(d.montant), 0)
  const beneficeEstime = caMois - totalDepensesMois // estimation simple (coût d'achat détaillé dans /admin/finances)

  const valeurStock = (articles ?? []).reduce((s, a) => s + a.quantite_stock * Number(a.prix_achat), 0)
  const produitsRupture = (articles ?? []).filter((a) => a.quantite_stock === 0).length
  const produitsStockFaible = (articles ?? []).filter((a) => a.quantite_stock > 0 && a.quantite_stock <= a.seuil_alerte).length

  // Top produits vendus (mois)
  const ventesParProduit = new Map<string, { quantite: number; ca: number }>()
  for (const v of ventesMois) {
    for (const l of (v as any).lignes_vente ?? []) {
      const existant = ventesParProduit.get(l.nom_article) ?? { quantite: 0, ca: 0 }
      existant.quantite += l.quantite
      existant.ca += Number(l.sous_total)
      ventesParProduit.set(l.nom_article, existant)
    }
  }
  const produitsTries = Array.from(ventesParProduit.entries()).sort((a, b) => b[1].quantite - a[1].quantite)
  const topProduits = produitsTries.slice(0, 5)
  const flopProduits = produitsTries.slice(-5).reverse()

  // Boutiques les plus performantes (CA du mois)
  const caParBoutique = new Map<string, number>()
  for (const v of ventesMois) {
    const nom = (v as any).boutiques?.nom ?? '—'
    caParBoutique.set(nom, (caParBoutique.get(nom) ?? 0) + Number(v.montant_total))
  }
  const boutiquesTriees = Array.from(caParBoutique.entries()).sort((a, b) => b[1] - a[1])

  // Ventes par jour (30 derniers jours) pour le graphique
  const il30jours = new Date(maintenant); il30jours.setDate(maintenant.getDate() - 30)
  const parJour: Record<string, number> = {}
  for (const v of ventesValides.filter((v) => v.created_at >= il30jours.toISOString())) {
    const jour = v.created_at.slice(0, 10)
    parJour[jour] = (parJour[jour] ?? 0) + Number(v.montant_total)
  }
  const donneesGraphique = Object.entries(parJour).sort(([a], [b]) => a.localeCompare(b)).map(([jour, ca]) => ({ jour, ca }))

  const cartesCA = [
    { label: "CA aujourd'hui", valeur: caJour },
    { label: 'CA cette semaine', valeur: caSemaine },
    { label: 'CA ce mois', valeur: caMois },
    { label: 'CA cette année', valeur: caAnnee },
  ]

  const cartesActivite = [
    { label: 'Ventes (année)', valeur: ventesValides.length },
    { label: 'Clients', valeur: nbClients ?? 0 },
    { label: 'Articles', valeur: articles?.length ?? 0 },
    { label: 'Valeur du stock', valeur: `${valeurStock.toLocaleString('fr-FR')} FCFA` },
    { label: 'Boutiques', valeur: nbBoutiques ?? 0 },
    { label: 'Caisses ouvertes', valeur: sessionsOuvertes ?? 0 },
    { label: 'Achats (mois)', valeur: `${totalAchatsMois.toLocaleString('fr-FR')} FCFA` },
    { label: 'Dépenses (mois)', valeur: `${totalDepensesMois.toLocaleString('fr-FR')} FCFA` },
    { label: 'Bénéfice estimé (mois)', valeur: `${beneficeEstime.toLocaleString('fr-FR')} FCFA` },
  ]

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Tableau de bord</h2>
        <form method="get">
          <select name="boutique" defaultValue={searchParams.boutique ?? ''} className="input-field" onChange={(e) => e.currentTarget.form?.submit()}>
            <option value="">Toutes les boutiques</option>
            {boutiques?.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
          </select>
        </form>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {cartesCA.map((c) => (
          <div key={c.label} className="card">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-lg font-bold text-primary-700 mt-1">{c.valeur.toLocaleString('fr-FR')} FCFA</p>
          </div>
        ))}
      </div>

      {(produitsRupture > 0 || produitsStockFaible > 0) && (
        <div className="card border-orange-200 bg-orange-50 mb-4 flex items-center gap-2 text-sm text-orange-700">
          <IconeAlerte className="w-4 h-4 shrink-0" />
          {produitsRupture > 0 && <span>{produitsRupture} article(s) en rupture</span>}
          {produitsRupture > 0 && produitsStockFaible > 0 && <span>·</span>}
          {produitsStockFaible > 0 && <span>{produitsStockFaible} article(s) en stock faible</span>}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {cartesActivite.map((c) => (
          <div key={c.label} className="card">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-base font-bold text-gray-800 mt-1">{c.valeur}</p>
          </div>
        ))}
      </div>

      <div className="card mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Ventes des 30 derniers jours</h3>
        <GraphiqueVentesJour donnees={donneesGraphique} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div>
          <h3 className="font-semibold text-gray-800 mb-2 text-sm">Produits les plus vendus (mois)</h3>
          <div className="card divide-y">
            {topProduits.map(([nom, d]) => (
              <div key={nom} className="flex justify-between py-1.5 text-sm">
                <span className="truncate">{nom}</span><span className="text-gray-500 shrink-0 ml-2">{d.quantite} vendu(s)</span>
              </div>
            ))}
            {topProduits.length === 0 && <p className="text-gray-400 text-sm py-3 text-center">Aucune vente ce mois.</p>}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 mb-2 text-sm">Produits les moins vendus (mois)</h3>
          <div className="card divide-y">
            {flopProduits.map(([nom, d]) => (
              <div key={nom} className="flex justify-between py-1.5 text-sm">
                <span className="truncate">{nom}</span><span className="text-gray-500 shrink-0 ml-2">{d.quantite} vendu(s)</span>
              </div>
            ))}
            {flopProduits.length === 0 && <p className="text-gray-400 text-sm py-3 text-center">Aucune vente ce mois.</p>}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 mb-2 text-sm">Boutiques les plus performantes (CA mois)</h3>
          <div className="card divide-y">
            {boutiquesTriees.map(([nom, ca]) => (
              <div key={nom} className="flex justify-between py-1.5 text-sm">
                <span className="truncate">{nom}</span><span className="text-gray-500 shrink-0 ml-2">{ca.toLocaleString('fr-FR')} FCFA</span>
              </div>
            ))}
            {boutiquesTriees.length === 0 && <p className="text-gray-400 text-sm py-3 text-center">Aucune vente ce mois.</p>}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 text-sm">
        <Link href="/admin/finances" className="text-primary-600 hover:underline">Voir le détail des finances →</Link>
        <Link href="/admin/rapport-journalier" className="text-primary-600 hover:underline">Imprimer le rapport de fin de journée →</Link>
      </div>
    </div>
  )
}
