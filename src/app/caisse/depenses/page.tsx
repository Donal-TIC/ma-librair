'use client'

import { useState } from 'react'
import { offlineDB } from '@/lib/offline-db'

export default function PageDepenses() {
  const [motif, setMotif] = useState('')
  const [montant, setMontant] = useState<number>(0)
  const [confirmation, setConfirmation] = useState(false)

  async function enregistrerDepense(e: React.FormEvent) {
    e.preventDefault()
    await offlineDB.depenses.add({
      uuid: crypto.randomUUID(),
      boutique_id: 'A_DEFINIR',
      motif,
      montant,
      effectue_par: 'A_DEFINIR',
      created_at: new Date().toISOString(),
      synced: false,
    })
    setMotif('')
    setMontant(0)
    setConfirmation(true)
    setTimeout(() => setConfirmation(false), 2500)
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Nouvelle dépense</h2>
      <form onSubmit={enregistrerDepense} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Motif de la dépense</label>
          <input
            required
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            className="input-field"
            placeholder="Ex : achat de fournitures, transport..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
          <input
            required
            type="number"
            value={montant || ''}
            onChange={(e) => setMontant(Number(e.target.value))}
            className="input-field"
          />
        </div>
        <button type="submit" className="btn-primary w-full">Enregistrer la dépense</button>
        {confirmation && <p className="text-green-600 text-sm text-center">Dépense enregistrée ✓</p>}
      </form>
    </div>
  )
}
