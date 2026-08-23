'use client'

import { useState, useTransition } from 'react'
import { creerBoutique } from '../actions'

export default function NouvelleBoutique() {
  const [nom, setNom] = useState('')
  const [adresse, setAdresse] = useState('')
  const [telephone, setTelephone] = useState('')
  const [budgetInitial, setBudgetInitial] = useState(0)
  const [erreur, setErreur] = useState('')
  const [enCours, demarrer] = useTransition()

  function soumettre(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    demarrer(async () => {
      try {
        await creerBoutique({ nom, adresse, telephone, budget_initial: budgetInitial })
      } catch (err: any) {
        setErreur(err.message ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Nouvelle boutique</h2>
      <form onSubmit={soumettre} className="card space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la boutique</label>
          <input required value={nom} onChange={(e) => setNom(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
          <input value={adresse} onChange={(e) => setAdresse(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
          <input value={telephone} onChange={(e) => setTelephone(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Budget initial (FCFA)</label>
          <input type="number" min={0} value={budgetInitial} onChange={(e) => setBudgetInitial(Number(e.target.value))} className="input-field" />
        </div>

        {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

        <button type="submit" disabled={enCours} className="btn-primary w-full">
          {enCours ? 'Création...' : 'Créer la boutique'}
        </button>
      </form>
    </div>
  )
}
