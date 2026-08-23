'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { rechercherOuCreerClient } from '../actions'
import { IconeUtilisateurs } from '@/components/icones'

interface Client { id: string; nom: string; telephone: string | null }
interface Achat { id: string; numero_recu: string; montant_total: number; created_at: string }

export default function PageClients({ boutiqueId }: { boutiqueId: string }) {
  const [recherche, setRecherche] = useState('')
  const [resultats, setResultats] = useState<Client[]>([])
  const [clientSelectionne, setClientSelectionne] = useState<Client | null>(null)
  const [achats, setAchats] = useState<Achat[]>([])
  const [chargement, setChargement] = useState(false)

  const [nouveauNom, setNouveauNom] = useState('')
  const [nouveauTelephone, setNouveauTelephone] = useState('')
  const [creationEnCours, setCreationEnCours] = useState(false)
  const [erreur, setErreur] = useState('')

  async function rechercher() {
    if (!recherche.trim()) return
    setChargement(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('clients')
      .select('id, nom, telephone')
      .eq('boutique_id', boutiqueId)
      .or(`nom.ilike.%${recherche}%,telephone.ilike.%${recherche}%`)
      .limit(20)
    setResultats(data ?? [])
    setChargement(false)
  }

  async function voirHistorique(client: Client) {
    setClientSelectionne(client)
    const supabase = createClient()
    const { data } = await supabase
      .from('ventes')
      .select('id, numero_recu, montant_total, created_at')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })
      .limit(30)
    setAchats(data ?? [])
  }

  async function creerClient(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    setCreationEnCours(true)
    try {
      await rechercherOuCreerClient(boutiqueId, nouveauNom, nouveauTelephone)
      setNouveauNom('')
      setNouveauTelephone('')
      setRecherche(nouveauNom)
      rechercher()
    } catch (err: any) {
      setErreur(err.message ?? 'Erreur lors de la création.')
    }
    setCreationEnCours(false)
  }

  if (clientSelectionne) {
    return (
      <div className="max-w-md mx-auto">
        <button onClick={() => setClientSelectionne(null)} className="text-primary-600 text-sm mb-4">← Retour</button>
        <div className="card mb-4">
          <p className="font-semibold text-gray-800">{clientSelectionne.nom}</p>
          {clientSelectionne.telephone && <p className="text-sm text-gray-500">{clientSelectionne.telephone}</p>}
        </div>
        <h3 className="font-semibold text-gray-700 text-sm mb-2">Historique d'achats</h3>
        <div className="card divide-y">
          {achats.map((a) => (
            <div key={a.id} className="flex justify-between py-2 text-sm">
              <div>
                <p className="font-medium">{a.numero_recu}</p>
                <p className="text-gray-400 text-xs">{new Date(a.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              <span className="font-medium">{Number(a.montant_total).toLocaleString('fr-FR')} FCFA</span>
            </div>
          ))}
          {achats.length === 0 && <p className="text-gray-400 text-sm py-4 text-center">Aucun achat enregistré.</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <IconeUtilisateurs className="w-5 h-5" /> Clients
      </h2>

      <div>
        <div className="flex gap-2">
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher un client (nom, téléphone)" className="input-field" />
          <button onClick={rechercher} className="btn-secondary whitespace-nowrap">Chercher</button>
        </div>
        <div className="card divide-y mt-3">
          {chargement && <p className="text-gray-400 text-sm py-3 text-center">Recherche...</p>}
          {!chargement && resultats.map((c) => (
            <button key={c.id} onClick={() => voirHistorique(c)} className="w-full text-left py-2 text-sm hover:bg-gray-50 px-1 -mx-1 rounded">
              <p className="font-medium">{c.nom}</p>
              {c.telephone && <p className="text-gray-400 text-xs">{c.telephone}</p>}
            </button>
          ))}
          {!chargement && resultats.length === 0 && recherche && (
            <p className="text-gray-400 text-sm py-3 text-center">Aucun client trouvé.</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-700 text-sm mb-2">Nouveau client</h3>
        <form onSubmit={creerClient} className="card space-y-3">
          <input required value={nouveauNom} onChange={(e) => setNouveauNom(e.target.value)} placeholder="Nom" className="input-field" />
          <input value={nouveauTelephone} onChange={(e) => setNouveauTelephone(e.target.value)} placeholder="Téléphone" className="input-field" />
          {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
          <button type="submit" disabled={creationEnCours} className="btn-primary w-full">
            {creationEnCours ? 'Création...' : 'Créer le client'}
          </button>
        </form>
      </div>
    </div>
  )
}
