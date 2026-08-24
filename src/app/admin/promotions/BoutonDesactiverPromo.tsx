'use client'

import { useTransition } from 'react'
import { desactiverPromotion } from './actions'

export default function BoutonDesactiverPromo({ id }: { id: string }) {
  const [enCours, demarrer] = useTransition()
  return (
    <button onClick={() => demarrer(() => desactiverPromotion(id))} disabled={enCours} className="text-red-600 hover:underline">
      {enCours ? '...' : 'Désactiver'}
    </button>
  )
}
