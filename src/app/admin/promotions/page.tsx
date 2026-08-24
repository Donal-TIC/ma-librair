import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { IconePromotion } from '@/components/icones'
import BoutonDesactiverPromo from './BoutonDesactiverPromo'

export default async function PagePromotions() {
  const supabase = createClient()
  const aujourdHui = new Date().toISOString().slice(0, 10)

  const { data: promotions } = await supabase
    .from('promotions')
    .select('id, type, valeur, date_debut, date_fin, actif, articles(nom), categories(nom), boutiques(nom)')
    .order('date_debut', { ascending: false })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <IconePromotion className="w-6 h-6" /> Promotions
        </h2>
        <Link href="/admin/promotions/nouvelle" className="btn-primary text-center">+ Nouvelle promotion</Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Cible</th><th className="pb-2">Réduction</th><th className="pb-2">Période</th><th className="pb-2">Statut</th><th className="pb-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(promotions ?? []).map((p: any) => {
              const enCours = p.actif && p.date_debut <= aujourdHui && p.date_fin >= aujourdHui
              const expire = p.date_fin < aujourdHui
              return (
                <tr key={p.id}>
                  <td className="py-2">{p.articles?.nom ?? p.categories?.nom} <span className="text-gray-400 text-xs">({p.boutiques?.nom})</span></td>
                  <td className="py-2">{p.type === 'pourcentage' ? `-${p.valeur}%` : `-${Number(p.valeur).toLocaleString('fr-FR')} FCFA`}</td>
                  <td className="py-2 text-gray-500">{new Date(p.date_debut).toLocaleDateString('fr-FR')} → {new Date(p.date_fin).toLocaleDateString('fr-FR')}</td>
                  <td className="py-2">
                    {!p.actif ? <span className="text-gray-400">Désactivée</span> :
                     expire ? <span className="text-gray-400">Expirée</span> :
                     enCours ? <span className="text-green-600">En cours</span> :
                     <span className="text-orange-600">À venir</span>}
                  </td>
                  <td className="py-2 text-right">{p.actif && !expire && <BoutonDesactiverPromo id={p.id} />}</td>
                </tr>
              )
            })}
            {(!promotions || promotions.length === 0) && <tr><td colSpan={5} className="py-6 text-center text-gray-400">Aucune promotion créée.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
