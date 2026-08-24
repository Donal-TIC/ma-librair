'use client'

import { useState, useTransition } from 'react'
import { creerRetourFournisseur } from '../actions'

export default function LigneRetourFournisseur({ achatId, articleId, nomArticle, boutiqueId, quantiteMax }: { achatId: string; articleId: string; nomArticle: string; boutiqueId: string; quantiteMax: number }) {
  const [ouvert, setOuvert] = useState(false)
  const [quantite, setQuantite] = useState(1)
  const [motif, setMotif] = useState('')
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)
  const [enCours, demarrer] = useTransition()

  function soumettre() {
    if (!motif.trim()) { setErreur('Le motif est obligatoire.'); return }
    setErreur('')
    demarrer(async () => {
      try {
        await creerRetourFournisseur(achatId, articleId, nomArticle, boutiqueId, quantite, motif)
        setSucces(true)
        setOuvert(false)
      } catch (err: any) {
        setErreur(err.message ?? 'Erreur.')
      }
    })
  }

  if (succes) return <p className="text-green-600 text-xs">Retour enregistré ✓</p>
  if (!ouvert) return <button onClick={() => setOuvert(true)} className="text-red-500 text-xs hover:underline">Retourner au fournisseur</button>

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <input type="number" min={1} max={quantiteMax} value={quantite} onChange={(e) => setQuantite(Number(e.target.value))} className="input-field w-20 text-sm" />
      <input value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Motif (ex: article endommagé)" className="input-field flex-1 min-w-[160px] text-sm" />
      <button onClick={soumettre} disabled={enCours} className="btn-secondary text-xs">{enCours ? '...' : 'Confirmer'}</button>
      <button onClick={() => setOuvert(false)} className="text-gray-400 text-xs">Annuler</button>
      {erreur && <p className="text-red-600 text-xs w-full">{erreur}</p>}
    </div>
  )
}
