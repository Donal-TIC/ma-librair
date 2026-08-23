'use client'

import { useState } from 'react'
import { changerMotDePasse } from '../actions'

export default function PageMotDePasse() {
  const [nouveau, setNouveau] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)
  const [enCours, setEnCours] = useState(false)

  async function soumettre(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    setSucces(false)

    if (nouveau.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (nouveau !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.')
      return
    }

    setEnCours(true)
    try {
      await changerMotDePasse(nouveau)
      setSucces(true)
      setNouveau('')
      setConfirmation('')
    } catch (err: any) {
      setErreur(err.message ?? 'Erreur lors du changement.')
    }
    setEnCours(false)
  }

  return (
    <div className="max-w-sm mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Changer mon mot de passe</h2>
      <form onSubmit={soumettre} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
          <input required type="password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
          <input required type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="input-field" />
        </div>
        {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
        {succes && <p className="text-green-600 text-sm">Mot de passe modifié ✓</p>}
        <button type="submit" disabled={enCours} className="btn-primary w-full">
          {enCours ? 'Modification...' : 'Modifier le mot de passe'}
        </button>
      </form>
    </div>
  )
}
