import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BoutonDesactiverFournisseur from './BoutonDesactiverFournisseur'

export default async function PageFournisseurs() {
  const supabase = createClient()
  const { data: fournisseurs } = await supabase
    .from('fournisseurs')
    .select('id, nom, telephone, personne_contact, actif')
    .order('nom')

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Fournisseurs</h2>
        <Link href="/admin/fournisseurs/nouveau" className="btn-primary text-center">+ Nouveau fournisseur</Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Nom</th><th className="pb-2">Contact</th><th className="pb-2">Téléphone</th><th className="pb-2">Statut</th><th className="pb-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(fournisseurs ?? []).map((f) => (
              <tr key={f.id}>
                <td className="py-2 font-medium">{f.nom}</td>
                <td className="py-2 text-gray-500">{f.personne_contact || '—'}</td>
                <td className="py-2 text-gray-500">{f.telephone || '—'}</td>
                <td className="py-2">{f.actif === false ? <span className="text-gray-400">Inactif</span> : <span className="text-green-600">Actif</span>}</td>
                <td className="py-2 text-right space-x-3">
                  <Link href={`/admin/fournisseurs/${f.id}`} className="text-primary-600 hover:underline">Modifier</Link>
                  {f.actif !== false && <BoutonDesactiverFournisseur id={f.id} />}
                </td>
              </tr>
            ))}
            {(!fournisseurs || fournisseurs.length === 0) && (
              <tr><td colSpan={5} className="py-6 text-center text-gray-400">Aucun fournisseur enregistré.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
