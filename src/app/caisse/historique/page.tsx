import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BoutonAnnuler from './BoutonAnnuler'
import { IconeStock } from '@/components/icones'

export default async function PageHistorique() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/caissier')

  const { data: ventes } = await supabase
    .from('ventes')
    .select('id, numero_recu, montant_total, annulee, created_at, lignes_vente(quantite)')
    .eq('caissier_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <IconeStock className="w-5 h-5" /> Historique des ventes
      </h2>

      <div className="card divide-y">
        {(ventes ?? []).map((v: any) => (
          <div key={v.id} className="py-3 text-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{v.numero_recu}</p>
                <p className="text-gray-400 text-xs">
                  {new Date(v.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} · {(v.lignes_vente ?? []).reduce((s: number, l: any) => s + l.quantite, 0)} article(s)
                </p>
              </div>
              <div className="text-right">
                <p className={`font-medium ${v.annulee ? 'line-through text-gray-400' : ''}`}>
                  {Number(v.montant_total).toLocaleString('fr-FR')} FCFA
                </p>
                {v.annulee ? (
                  <span className="text-xs text-red-500">Annulée</span>
                ) : (
                  <BoutonAnnuler venteId={v.id} />
                )}
              </div>
            </div>
          </div>
        ))}
        {(!ventes || ventes.length === 0) && <p className="text-gray-400 text-sm py-6 text-center">Aucune vente enregistrée.</p>}
      </div>
    </div>
  )
}
