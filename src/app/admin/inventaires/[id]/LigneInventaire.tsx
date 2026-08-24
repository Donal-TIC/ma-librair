'use client'

import { useState, useTransition } from 'react'
import { enregistrerComptage } from '../actions'

interface Ligne { id: string; nom_article: string; stock_theorique: number; stock_compte: number | null; ecart: number | null; justification: string | null }

export default function LigneInventaire({ ligne, verrouille }: { ligne: Ligne; verrouille: boolean }) {
  const [stockCompte, setStockCompte] = useState<number | ''>(ligne.stock_compte ?? '')
  const [justification, setJustification] = useState(ligne.justification ?? '')
  const [erreur, setErreur] = useState('')
  const [enregistre, setEnregistre] = useState(ligne.stock_compte !== null)
  const [enCours, demarrer] = useTransition()

  const ecartPrevu = stockCompte !== '' ? Number(stockCompte) - ligne.stock_theorique : null

  function enregistrer() {
    if (stockCompte === '') return
    setErreur('')
    demarrer(async () => {
      try {
        await enregistrerComptage(ligne.id, Number(stockCompte), justification)
        setEnregistre(true)
      } catch (err: any) {
        setErreur(err.message ?? 'Erreur.')
      }
    })
  }

  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{ligne.nom_article}</p>
          <p className="text-xs text-gray-400">Stock système : {ligne.stock_theorique}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number" min={0} disabled={verrouille}
            value={stockCompte}
            onChange={(e) => { setStockCompte(e.target.value === '' ? '' : Number(e.target.value)); setEnregistre(false) }}
            className="input-field w-24"
            placeholder="Réel"
          />
          {ecartPrevu !== null && ecartPrevu !== 0 && (
            <span className={ecartPrevu > 0 ? 'text-orange-600 text-xs' : 'text-red-600 text-xs'}>
              {ecartPrevu > 0 ? '+' : ''}{ecartPrevu}
            </span>
          )}
        </div>
      </div>

      {stockCompte !== '' && Number(stockCompte) !== ligne.stock_theorique && !verrouille && (
        <div className="mt-2">
          <input
            value={justification}
            onChange={(e) => { setJustification(e.target.value); setEnregistre(false) }}
            placeholder="Justification de l'écart (obligatoire)"
            className="input-field text-sm"
          />
        </div>
      )}

      {!verrouille && stockCompte !== '' && !enregistre && (
        <button onClick={enregistrer} disabled={enCours} className="text-primary-600 text-xs hover:underline mt-1">
          {enCours ? 'Enregistrement...' : 'Valider ce comptage'}
        </button>
      )}
      {enregistre && <p className="text-green-600 text-xs mt-1">Comptage enregistré ✓</p>}
      {erreur && <p className="text-red-600 text-xs mt-1">{erreur}</p>}
    </div>
  )
}
