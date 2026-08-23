'use client'

import { useState, useTransition } from 'react'
import { modifierBoutique } from '../actions'

export default function FormulaireBoutique({ boutique }: { boutique: any }) {
  const [nom, setNom] = useState(boutique.nom)
  const [adresse, setAdresse] = useState(boutique.adresse ?? '')
  const [telephone, setTelephone] = useState(boutique.telephone ?? '')
  const [actif, setActif] = useState<boolean>(boutique.actif)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)
  const [enCours, demarrer] = useTransition()

  function soumettre(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    setSucces(false)
    demarrer(async () => {
      try {
        await modifierBoutique(boutique.id, { nom, adresse, telephone, actif })
        setSucces(true)
      } catch (err: any) {
        setErreur(err.message ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
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
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} />
        Boutique active
      </label>

      {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
      {succes && <p className="text-green-600 text-sm">Modifications enregistrées ✓</p>}

      <button type="submit" disabled={enCours} className="btn-primary w-full">
        {enCours ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </form>
  )
}
