'use client'

import { useState, useTransition } from 'react'
import type { FournisseurFormData } from './actions'

interface Props {
  boutiques: { id: string; nom: string }[]
  valeursInitiales?: Partial<FournisseurFormData>
  onValider: (donnees: FournisseurFormData) => Promise<void>
  libelleBouton: string
}

export default function FormulaireFournisseur({ boutiques, valeursInitiales, onValider, libelleBouton }: Props) {
  const [form, setForm] = useState<FournisseurFormData>({
    boutique_id: valeursInitiales?.boutique_id ?? boutiques[0]?.id ?? '',
    nom: valeursInitiales?.nom ?? '',
    telephone: valeursInitiales?.telephone ?? '',
    adresse: valeursInitiales?.adresse ?? '',
    personne_contact: valeursInitiales?.personne_contact ?? '',
    conditions_paiement: valeursInitiales?.conditions_paiement ?? '',
    notes: valeursInitiales?.notes ?? '',
  })
  const [erreur, setErreur] = useState('')
  const [enCours, demarrer] = useTransition()

  function soumettre(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    demarrer(async () => {
      try {
        await onValider(form)
      } catch (err: any) {
        setErreur(err.message ?? 'Erreur.')
      }
    })
  }

  return (
    <form onSubmit={soumettre} className="card space-y-4 max-w-xl">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Boutique associée</label>
        <select required value={form.boutique_id} onChange={(e) => setForm({ ...form, boutique_id: e.target.value })} className="input-field">
          {boutiques.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nom / Entreprise</label>
        <input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="input-field" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Personne de contact</label>
          <input value={form.personne_contact} onChange={(e) => setForm({ ...form, personne_contact: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
          <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className="input-field" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
        <input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} className="input-field" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Conditions de paiement</label>
        <input value={form.conditions_paiement} onChange={(e) => setForm({ ...form, conditions_paiement: e.target.value })} className="input-field" placeholder="Ex : paiement à 30 jours" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} />
      </div>

      {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

      <button type="submit" disabled={enCours} className="btn-primary w-full">
        {enCours ? 'Enregistrement...' : libelleBouton}
      </button>
    </form>
  )
}
