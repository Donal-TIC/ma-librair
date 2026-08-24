import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { IconeAchat } from '@/components/icones'

const libellesStatut: Record<string, { label: string; couleur: string }> = {
  brouillon: { label: 'Brouillon', couleur: 'text-gray-400' },
  commandee: { label: 'Commandée', couleur: 'text-orange-600' },
  partiellement_recue: { label: 'Partiellement reçue', couleur: 'text-orange-600' },
  recue: { label: 'Reçue', couleur: 'text-green-600' },
  annulee: { label: 'Annulée', couleur: 'text-red-400' },
}

export default async function PageAchats() {
  const supabase = createClient()
  const { data: achats } = await supabase
    .from('achats')
    .select('id, numero, statut, montant_total, created_at, fournisseurs(nom), boutiques(nom)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <IconeAchat className="w-6 h-6" /> Achats fournisseurs
        </h2>
        <Link href="/admin/achats/nouveau" className="btn-primary text-center">+ Nouvelle commande</Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Numéro</th><th className="pb-2">Fournisseur</th><th className="pb-2">Boutique</th>
              <th className="pb-2">Montant</th><th className="pb-2">Statut</th><th className="pb-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(achats ?? []).map((a: any) => (
              <tr key={a.id}>
                <td className="py-2 font-mono text-xs">{a.numero}</td>
                <td className="py-2">{a.fournisseurs?.nom}</td>
                <td className="py-2 text-gray-500">{a.boutiques?.nom}</td>
                <td className="py-2">{Number(a.montant_total).toLocaleString('fr-FR')} FCFA</td>
                <td className={`py-2 ${libellesStatut[a.statut]?.couleur}`}>{libellesStatut[a.statut]?.label ?? a.statut}</td>
                <td className="py-2 text-right"><Link href={`/admin/achats/${a.id}`} className="text-primary-600 hover:underline">Voir</Link></td>
              </tr>
            ))}
            {(!achats || achats.length === 0) && (
              <tr><td colSpan={6} className="py-6 text-center text-gray-400">Aucune commande enregistrée.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
