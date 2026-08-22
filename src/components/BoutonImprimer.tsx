'use client'

export default function BoutonImprimer() {
  return (
    <button onClick={() => window.print()} className="btn-secondary text-sm">
      Imprimer l'étiquette
    </button>
  )
}
