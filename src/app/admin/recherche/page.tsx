import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function RechercheGlobale({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim() ?? ''
  const supabase = createClient()

  if (!q) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Recherche globale</h2>
        <FormRecherche q={q} />
        <p className="text-gray-400 text-sm mt-6">Tapez un nom, un numéro de reçu, un code-barre ou un téléphone pour commencer.</p>
      </div>
    )
  }

  const [
    { data: articles },
    { data: clients },
    { data: fournisseurs },
    { data: boutiques },
    { data: ventes },
    { data: transferts },
    { data: achats },
    { data: utilisateurs },
  ] = await Promise.all([
    supabase.from('articles').select('id, nom, code_barre, boutiques(nom)').or(`nom.ilike.%${q}%,code_barre.ilike.%${q}%`).limit(10),
    supabase.from('clients').select('id, nom, telephone').or(`nom.ilike.%${q}%,telephone.ilike.%${q}%`).limit(10),
    supabase.from('fournisseurs').select('id, nom').ilike('nom', `%${q}%`).limit(10),
    supabase.from('boutiques').select('id, nom').ilike('nom', `%${q}%`).limit(10),
    supabase.from('ventes').select('id, numero_recu, montant_total').ilike('numero_recu', `%${q}%`).limit(10),
    supabase.from('transferts').select('id, numero').ilike('numero', `%${q}%`).limit(10),
    supabase.from('achats').select('id, numero').ilike('numero', `%${q}%`).limit(10),
    supabase.from('profils').select('id, nom_complet, role').ilike('nom_complet', `%${q}%`).limit(10),
  ])

  const sections = [
    { titre: 'Articles', items: (articles ?? []).map((a: any) => ({ label: `${a.nom} (${a.code_barre})`, sous: a.boutiques?.nom, href: `/admin/articles/${a.id}` })) },
    { titre: 'Clients', items: (clients ?? []).map((c) => ({ label: c.nom, sous: c.telephone, href: `/admin/boutiques` })) },
    { titre: 'Fournisseurs', items: (fournisseurs ?? []).map((f) => ({ label: f.nom, sous: '', href: `/admin/fournisseurs/${f.id}` })) },
    { titre: 'Boutiques', items: (boutiques ?? []).map((b) => ({ label: b.nom, sous: '', href: `/admin/boutiques/${b.id}` })) },
    { titre: 'Ventes', items: (ventes ?? []).map((v) => ({ label: v.numero_recu, sous: `${Number(v.montant_total).toLocaleString('fr-FR')} FCFA`, href: `/admin/ventes/${v.id}` })) },
    { titre: 'Transferts', items: (transferts ?? []).map((t) => ({ label: t.numero, sous: '', href: `/admin/transferts/${t.id}` })) },
    { titre: 'Achats', items: (achats ?? []).map((a) => ({ label: a.numero, sous: '', href: `/admin/achats/${a.id}` })) },
    { titre: 'Utilisateurs', items: (utilisateurs ?? []).map((u) => ({ label: u.nom_complet, sous: u.role, href: `/admin/boutiques` })) },
  ]
  const totalResultats = sections.reduce((s, sec) => s + sec.items.length, 0)

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Recherche globale</h2>
      <FormRecherche q={q} />

      <p className="text-gray-500 text-sm my-4">{totalResultats} résultat(s) pour « {q} »</p>

      <div className="grid sm:grid-cols-2 gap-4">
        {sections.filter((s) => s.items.length > 0).map((section) => (
          <div key={section.titre}>
            <h3 className="font-semibold text-gray-700 text-sm mb-2">{section.titre}</h3>
            <div className="card divide-y">
              {section.items.map((item, i) => (
                <Link key={i} href={item.href} className="flex justify-between py-2 text-sm hover:bg-gray-50 px-1 -mx-1 rounded">
                  <span>{item.label}</span>
                  {item.sous && <span className="text-gray-400">{item.sous}</span>}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {totalResultats === 0 && <p className="text-gray-400 text-sm text-center py-8">Aucun résultat pour « {q} ».</p>}
    </div>
  )
}

function FormRecherche({ q }: { q: string }) {
  return (
    <form method="get" className="flex gap-2 max-w-lg">
      <input name="q" defaultValue={q} placeholder="Rechercher un article, client, vente, fournisseur..." className="input-field" autoFocus />
      <button type="submit" className="btn-primary whitespace-nowrap">Chercher</button>
    </form>
  )
}
