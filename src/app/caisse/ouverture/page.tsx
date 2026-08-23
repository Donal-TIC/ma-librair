'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ouvrirCaisse } from '../actions'
import { IconePanier } from '@/components/icones'

export default function PageOuvertureCaisse() {
  const [fondInitial, setFondInitial] = useState(0)
  const [erreur, setErreur] = useState('')
  const [enCours, demarrer] = useTransition()
  const router = useRouter()

  function soumettre(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    demarrer(async () => {
      try {
        await ouvrirCaisse(fondInitial)
        router.push('/caisse')
        router.refresh()
      } catch (err: any) {
        setErreur(err.message ?? "Erreur lors de l'ouverture.")
      }
    })
  }

  return (
    <div className="max-w-sm mx-auto mt-8">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <IconePanier className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Ouverture de caisse</h2>
        <p className="text-gray-500 text-sm mt-1">Indiquez le fond de caisse initial avant de commencer à vendre.</p>
      </div>

      <form onSubmit={soumettre} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fond de caisse initial (FCFA)</label>
          <input
            required
            type="number"
            min={0}
            value={fondInitial || ''}
            onChange={(e) => setFondInitial(Number(e.target.value))}
            className="input-field"
            placeholder="0"
            autoFocus
          />
        </div>

        {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

        <button type="submit" disabled={enCours} className="btn-primary w-full">
          {enCours ? 'Ouverture...' : 'Ouvrir la caisse'}
        </button>
      </form>
    </div>
  )
}
