import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FormulaireReceptionAchat from './FormulaireReceptionAchat'
import LigneRetourFournisseur from './LigneRetourFournisseur'
import BoutonAnnulerAchat from './BoutonAnnulerAchat'

export default async function DetailAchat({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: achat } = await supabase
    .from('achats')
    .select('id, numero, statut, montant_total, created_at, boutique_id, fournisseurs(nom), boutiques(nom)')
    .eq('id', params.id)
    .single()
  if (!achat) notFound()

  const { data: lignes } = await supabase
    .from('achats_lignes')
    .select('id, article_id, nom_article, quantite_commandee, quantite_recue, prix_achat_unitaire')
    .eq('achat_id', params.id)

  const { data: retours } = await supabase
    .from('retours_fournisseurs')
    .select('nom_article, quantite, motif, created_at')
    .eq('achat_id', params.id)
    .order('created_at', { ascending: false })

  const peutAnnuler = achat.statut === 'commandee' && (lignes ?? []).every((l) => l.quantite_recue === 0)
  const peutReceptionner = achat.statut === 'commandee' || achat.statut === 'partiellement_recue'

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-1">Commande {achat.numero}</h2>
      <p className="text-gray-500 text-sm mb-6">
        {(achat as any).fournisseurs?.nom} → {(achat as any).boutiques?.nom} · {new Date(achat.created_at).toLocaleDateString('fr-FR')} · {Number(achat.montant_total).toLocaleString('fr-FR')} FCFA
      </p>

      <div className="card divide-y mb-4">
        {(lignes ?? []).map((l) => (
          <div key={l.id} className="py-3">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">{l.nom_article}</span>
              <span className="text-gray-500">Commandé : {l.quantite_commandee} · Reçu : {l.quantite_recue}</span>
            </div>
            {l.quantite_recue > 0 && (
              <LigneRetourFournisseur achatId={achat.id} articleId={l.article_id} nomArticle={l.nom_article} boutiqueId={achat.boutique_id} quantiteMax={l.quantite_recue} />
            )}
          </div>
        ))}
      </div>

      {peutAnnuler && <BoutonAnnulerAchat achatId={achat.id} />}
      {peutReceptionner && <FormulaireReceptionAchat achatId={achat.id} lignes={lignes ?? []} />}
      {achat.statut === 'recue' && <p className="text-green-600 text-sm">✓ Commande entièrement reçue.</p>}
      {achat.statut === 'annulee' && <p className="text-gray-400 text-sm">Commande annulée.</p>}

      {retours && retours.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-700 text-sm mb-2">Retours effectués</h3>
          <div className="card divide-y">
            {retours.map((r, i) => (
              <div key={i} className="py-2 text-sm flex justify-between">
                <span>{r.nom_article} × {r.quantite} — {r.motif}</span>
                <span className="text-gray-400 text-xs">{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
