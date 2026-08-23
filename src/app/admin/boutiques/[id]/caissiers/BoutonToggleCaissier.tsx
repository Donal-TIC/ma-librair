'use client'

import { useTransition } from 'react'
import { desactiverCaissier, reactiverCaissier } from '../../actions'

export default function BoutonToggleCaissier({ profilId, boutiqueId, actif }: { profilId: string; boutiqueId: string; actif: boolean }) {
  const [enCours, demarrer] = useTransition()

  function basculer() {
    const confirmation = actif
      ? "Désactiver ce caissier ? Il ne pourra plus se connecter."
      : "Réactiver ce caissier ?"
    if (!window.confirm(confirmation)) return

    demarrer(() => (actif ? desactiverCaissier(profilId, boutiqueId) : reactiverCaissier(profilId, boutiqueId)))
  }

  return (
    <button onClick={basculer} disabled={enCours} className={actif ? 'text-red-600 hover:underline' : 'text-green-600 hover:underline'}>
      {enCours ? '...' : actif ? 'Désactiver' : 'Réactiver'}
    </button>
  )
}
