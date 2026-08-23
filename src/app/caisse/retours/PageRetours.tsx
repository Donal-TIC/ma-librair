'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { creerRetour } from '../actions'

interface LigneVente { id: string; nom_article: string; prix_unitaire: number; quantite: number }
interface Vente { id: string; numero_recu: string; created_at: string; lignes_vente: LigneVente[] }

export default function PageRetours() {
  const [numeroRecu, setNumeroRecu] = useState('')
  const [vente, setVente] = useState<Vente | null>(null)
  const [erreurRecherche, setErreurRecherche] = useState('')
  const [chargement, setChargement] = useState(false)

  const [ligneChoisie, setLigneChoisie] = useState<LigneVente | null>(null)
  const [quantiteRetour, setQuantiteRetour] = useState(1)
  const [motif, setMotif] = useState('')
  const [succes, setSucces] = useState(false)
  const [erreur, setErreur] = useState('')

  async function rechercher() {
    if (!numeroRecu.trim()) return
    setChargement(true)
    setErreurRecherche('')
    setVente(null)
    const supabase = createClient()
    const { data } = await supabase
      .from('ventes')
      .select('id, numero_recu, created_at, lignes_vente(id, nom_article, prix_unitaire, quantite)')
      .eq('numero_recu', numeroRecu.trim())
      .maybeSingle()
    setChargement(false)
    if (!data) {
      setErreurRecherche('Aucune vente trouvée avec ce numéro de reçu.')
      return
    }
    setVente(data as any)
  }

  async function soumettreRetour(e: React.FormEvent) {
    e.preventDefault()
    if (!vente || !ligneChoisie) return
    setErreur('')
    try {
      await creerRetour({
        venteId: vente.id,
        ligneVenteId: ligneChoisie.id,
        quantite: quantiteRetour,
        motif,
        montantRembourse: ligneChoisie.prix_unitaire * quantiteRetour,
      })
      setSucces(true)
      setLigneChoisie(null)
      setMotif('')
    } catch (err: any) {
      setErreur(err.message ?? 'Erreur lors du retour.')
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Retours & remboursements</h2>

      <div className="flex gap-2 mb-4">
        <input value={numeroRecu} onChange={(e) => setNumeroRecu(e.target.value)} placeholder="Numéro de reçu (ex: REC-...)" className="input-field" />
        <button onClick={rechercher} className="btn-secondary whitespace-nowrap">{chargement ? '...' : 'Chercher'}</button>
      </div>
      {erreurRecherche && <p className="text-red-600 text-sm mb-4">{erreurRecherche}</p>}

      {vente && !ligneChoisie && (
        <div className="card divide-y">
          <p className="text-sm text-gray-500 pb-2">Choisissez l'article à retourner :</p>
          {vente.lignes_vente.map((l) => (
            <button key={l.id} onClick={() => { setLigneChoisie(l); setQuantiteRetour(1); setSucces(false) }} className="w-full text-left py-2 text-sm hover:bg-gray-50 px-1 -mx-1 rounded flex justify-between">
              <span>{l.nom_article} (× {l.quantite})</span>
              <span className="text-gray-500">{l.prix_unitaire.toLocaleString('fr-FR')} FCFA/u</span>
            </button>
          ))}
        </div>
      )}

      {ligneChoisie && (
        <form onSubmit={soumettreRetour} className="card space-y-3 mt-4">
          <p className="font-medium text-sm">{ligneChoisie.nom_article}</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantité à retourner</label>
            <input type="number" min={1} max={ligneChoisie.quantite} value={quantiteRetour} onChange={(e) => setQuantiteRetour(Number(e.target.value))} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motif du retour</label>
            <input required value={motif} onChange={(e) => setMotif(e.target.value)} className="input-field" placeholder="Ex : article défectueux, erreur de vente..." />
          </div>
          <p className="text-sm text-gray-500">Montant à rembourser : {(ligneChoisie.prix_unitaire * quantiteRetour).toLocaleString('fr-FR')} FCFA</p>

          {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

          <div className="flex gap-2">
            <button type="button" onClick={() => setLigneChoisie(null)} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" className="btn-primary flex-1">Valider le retour</button>
          </div>
        </form>
      )}

      {succes && <p className="text-green-600 text-sm mt-4 text-center">Retour enregistré, stock remis à jour ✓</p>}
    </div>
  )
}
