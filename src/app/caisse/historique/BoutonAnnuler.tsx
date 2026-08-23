'use client'

import { useState, useTransition } from 'react'
import { annulerVente } from '../actions'

export default function BoutonAnnuler({ venteId }: { venteId: string }) {
  const [enCours, demarrer] = useTransition()

  function annuler() {
    const motif = window.prompt("Motif de l'annulation :")
    if (!motif) return
    demarrer(() => annulerVente(venteId, motif))
  }

  return (
    <button onClick={annuler} disabled={enCours} className="text-xs text-red-500 hover:underline">
      {enCours ? '...' : 'Annuler'}
    </button>
  )
}
