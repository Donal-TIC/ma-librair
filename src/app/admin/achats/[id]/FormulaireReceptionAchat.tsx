'use client'

import { useState, useTransition } from 'react'
import { receptionnerAchat } from '../actions'

interface Ligne { id: string; nom_article: string; quantite_commandee: number; quantite_recue: number }

export default function FormulaireReceptionAchat({ achatId, lignes }: { achatId: string; lignes: Ligne[] }) {
  const [quantites, setQuantites] = useState<Record<string, number>>(
    Object.fromEntries(lignes.map((l) => [l.id, l.quantite_commandee - l.quantite_recue]))
  )
  const [erreur, setErreur] = useState('')
  const [enCours, demarrer] = useTransition()

  function soumettre() {
    setErreur('')
    demarrer(async () => {
      try {
        await receptionnerAchat(achatId, quantites)
      } catch (err: any) {
        setErreur(err.message ?? 'Erreur lors de la réception.')
      }
    })
  }

  const lignesRestantes = lignes.filter((l) => l.quantite_recue < l.quantite_commandee)
  if (lignesRestantes.length === 0) return null

  return (
    <div className="card space-y-3">
      <h3 className="font-semibold text-gray-700 text-sm">Réceptionner (maintenant)</h3>
      {lignesRestantes.map((l) => {
        const restant = l.quantite_commandee - l.quantite_recue
        return (
          <div key={l.id} className="flex items-center justify-between gap-3">
            <span className="text-sm">{l.nom_article} <span className="text-gray-400">(restant : {restant})</span></span>
            <input
              type="number" min={0} max={restant}
              value={quantites[l.id]}
              onChange={(e) => setQuantites((prev) => ({ ...prev, [l.id]: Number(e.target.value) }))}
              className="input-field w-24"
            />
          </div>
        )
      })}
      {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
      <button onClick={soumettre} disabled={enCours} className="btn-primary w-full">
        {enCours ? 'Traitement...' : 'Valider la réception'}
      </button>
      <p className="text-xs text-gray-400">Une réception partielle est possible : le reste pourra être réceptionné plus tard, dès qu'il arrivera.</p>
    </div>
  )
}
