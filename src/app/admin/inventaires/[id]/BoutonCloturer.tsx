'use client'

import { useTransition } from 'react'
import { cloturerInventaire } from '../actions'

export default function BoutonCloturer({ inventaireId }: { inventaireId: string }) {
  const [enCours, demarrer] = useTransition()

  function cloturer() {
    if (!window.confirm("Clôturer l'inventaire ? Le stock des articles comptés sera corrigé automatiquement selon les écarts constatés.")) return
    demarrer(() => cloturerInventaire(inventaireId))
  }

  return (
    <button onClick={cloturer} disabled={enCours} className="btn-primary mb-2">
      {enCours ? 'Clôture...' : "Clôturer l'inventaire et corriger le stock"}
    </button>
  )
}
