import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FormulaireCaissier from './FormulaireCaissier'
import BoutonToggleCaissier from './BoutonToggleCaissier'

export default async function CaissiersBoutique({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: boutique } = await supabase.from('boutiques').select('id, nom').eq('id', params.id).single()
  if (!boutique) notFound()

  const { data: caissiers } = await supabase
    .from('profils')
    .select('id, nom_complet, actif, created_at')
    .eq('boutique_id', params.id)
    .eq('role', 'caissier')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-1">Caissiers — {boutique.nom}</h2>
      <p className="text-gray-500 text-sm mb-6">Créez et gérez les accès des caissiers de cette boutique.</p>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Nom</th>
                  <th className="pb-2">Statut</th>
                  <th className="pb-2">Créé le</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(caissiers ?? []).map((c) => (
                  <tr key={c.id}>
                    <td className="py-2 font-medium">{c.nom_complet}</td>
                    <td className="py-2">
                      <span className={c.actif ? 'text-green-600' : 'text-gray-400'}>
                        {c.actif ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td className="py-2 text-gray-500">
                      {new Date(c.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-2 text-right">
                      <BoutonToggleCaissier profilId={c.id} boutiqueId={boutique.id} actif={c.actif} />
                    </td>
                  </tr>
                ))}
                {(!caissiers || caissiers.length === 0) && (
                  <tr><td colSpan={4} className="py-6 text-center text-gray-400">Aucun caissier pour cette boutique.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Nouveau caissier</h3>
          <FormulaireCaissier boutiqueId={boutique.id} />
        </div>
      </div>
    </div>
  )
}
