'use client'

import { useState, useTransition } from 'react'
import { receptionnerTransfert } from '../actions'

interface Ligne { id: string; nom_article: string; quantite_envoyee: number; quantite_recue: number | null }

export default function FormulaireReception({ transfertId, lignes }: { transfertId: string; lignes: Ligne[] }) {
  const [quantites, setQuantites] = useState<Record<string, number>>(
    Object.fromEntries(lignes.map((l) => [l.id, l.quantite_recue ?? l.quantite_envoyee]))
  )
  const [erreur, setErreur] = useState('')
  const [enCours, demarrer] = useTransition()

  function soumettre() {
    setErreur('')
    demarrer(async () => {
      try {
        await receptionnerTransfert(transfertId, quantites)
      } catch (err: any) {
        setErreur(err.message ?? 'Erreur lors de la réception.')
      }
    })
  }

  return (
    <div className="card space-y-3">
      <h3 className="font-semibold text-gray-700 text-sm">Réceptionner ce transfert</h3>
      {lignes.map((l) => (
        <div key={l.id} className="flex items-center justify-between gap-3">
          <span className="text-sm">{l.nom_article} <span className="text-gray-400">(envoyé : {l.quantite_envoyee})</span></span>
          <input
            type="number" min={0} max={l.quantite_envoyee}
            value={quantites[l.id]}
            onChange={(e) => setQuantites((prev) => ({ ...prev, [l.id]: Number(e.target.value) }))}
            className="input-field w-24"
          />
        </div>
      ))}
      {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
      <button onClick={soumettre} disabled={enCours} className="btn-primary w-full">
        {enCours ? 'Traitement...' : 'Valider la réception'}
      </button>
      <p className="text-xs text-gray-400">Si une quantité reçue est inférieure à celle envoyée, le transfert sera marqué "partiellement reçu" et l'écart sera conservé dans l'historique.</p>
    </div>
  )
}
