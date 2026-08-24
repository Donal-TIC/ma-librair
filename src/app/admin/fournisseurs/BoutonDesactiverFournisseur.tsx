'use client'

import { useTransition } from 'react'
import { desactiverFournisseur } from './actions'

export default function BoutonDesactiverFournisseur({ id }: { id: string }) {
  const [enCours, demarrer] = useTransition()

  function desactiver() {
    if (!window.confirm('Désactiver ce fournisseur ?')) return
    demarrer(() => desactiverFournisseur(id))
  }

  return (
    <button onClick={desactiver} disabled={enCours} className="text-red-600 hover:underline">
      {enCours ? '...' : 'Désactiver'}
    </button>
  )
}
