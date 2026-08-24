'use client'

import { useTransition } from 'react'
import { annulerAchat } from '../actions'

export default function BoutonAnnulerAchat({ achatId }: { achatId: string }) {
  const [enCours, demarrer] = useTransition()

  function annuler() {
    if (!window.confirm('Annuler cette commande fournisseur ?')) return
    demarrer(() => annulerAchat(achatId))
  }

  return (
    <button onClick={annuler} disabled={enCours} className="text-red-500 text-sm hover:underline mb-3 block">
      {enCours ? '...' : 'Annuler la commande'}
    </button>
  )
}
