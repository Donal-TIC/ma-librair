'use client'

import { useTransition } from 'react'
import { supprimerArticle } from './actions'

export default function BoutonSupprimer({ articleId }: { articleId: string }) {
  const [enCours, demarrer] = useTransition()

  function confirmer() {
    if (!window.confirm('Retirer cet article du catalogue ? Son historique sera conservé.')) return
    demarrer(() => supprimerArticle(articleId))
  }

  return (
    <button onClick={confirmer} disabled={enCours} className="text-red-600 hover:underline disabled:opacity-50">
      {enCours ? '...' : 'Retirer'}
    </button>
  )
}
