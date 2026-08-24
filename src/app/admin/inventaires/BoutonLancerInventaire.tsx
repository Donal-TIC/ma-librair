'use client'

import { useState, useTransition } from 'react'
import { lancerInventaire } from './actions'

export default function BoutonLancerInventaire({ boutiques }: { boutiques: { id: string; nom: string }[] }) {
  const [ouvert, setOuvert] = useState(false)
  const [boutiqueId, setBoutiqueId] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, demarrer] = useTransition()

  function lancer() {
    if (!boutiqueId) return
    setErreur('')
    demarrer(async () => {
      try {
        await lancerInventaire(boutiqueId)
      } catch (err: any) {
        setErreur(err.message ?? "Erreur lors du lancement de l'inventaire.")
      }
    })
  }

  if (!ouvert) {
    return <button onClick={() => setOuvert(true)} className="btn-primary text-center">+ Lancer un inventaire</button>
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
      <select value={boutiqueId} onChange={(e) => setBoutiqueId(e.target.value)} className="input-field">
        <option value="">Choisir une boutique...</option>
        {boutiques.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
      </select>
      <button onClick={lancer} disabled={enCours || !boutiqueId} className="btn-primary whitespace-nowrap disabled:opacity-40">
        {enCours ? 'Lancement...' : 'Lancer'}
      </button>
      {erreur && <p className="text-red-600 text-xs">{erreur}</p>}
    </div>
  )
}
