'use client'

import { useState, useTransition } from 'react'
import { ajusterStock } from '../articles/actions'

export default function FormulaireAjustement({ articles }: { articles: { id: string; nom: string; boutique_id: string; code_barre: string }[] }) {
  const [articleId, setArticleId] = useState('')
  const [type, setType] = useState<'entree' | 'sortie' | 'perte' | 'correction'>('entree')
  const [quantite, setQuantite] = useState(1)
  const [motif, setMotif] = useState('')
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)
  const [enCours, demarrer] = useTransition()

  const articleChoisi = articles.find((a) => a.id === articleId)

  function soumettre(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    setSucces(false)
    if (!articleChoisi) {
      setErreur('Choisissez un article.')
      return
    }
    if (!motif.trim()) {
      setErreur('Le motif est obligatoire pour tracer ce mouvement.')
      return
    }
    demarrer(async () => {
      try {
        await ajusterStock(articleChoisi.id, articleChoisi.boutique_id, quantite, type, motif)
        setSucces(true)
        setMotif('')
        setQuantite(1)
      } catch (err: any) {
        setErreur(err.message ?? 'Erreur lors de l\'ajustement.')
      }
    })
  }

  return (
    <form onSubmit={soumettre} className="card space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Article</label>
        <select required value={articleId} onChange={(e) => setArticleId(e.target.value)} className="input-field">
          <option value="">Sélectionner...</option>
          {articles.map((a) => <option key={a.id} value={a.id}>{a.nom} ({a.code_barre})</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type de mouvement</label>
        <select value={type} onChange={(e) => setType(e.target.value as any)} className="input-field">
          <option value="entree">Entrée (réapprovisionnement)</option>
          <option value="sortie">Sortie</option>
          <option value="perte">Perte / casse</option>
          <option value="correction">Correction d'inventaire</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
        <input required type="number" min={1} value={quantite} onChange={(e) => setQuantite(Number(e.target.value))} className="input-field" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Motif (obligatoire)</label>
        <input required value={motif} onChange={(e) => setMotif(e.target.value)} className="input-field" placeholder="Ex : livraison fournisseur, article endommagé..." />
      </div>

      {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
      {succes && <p className="text-green-600 text-sm">Mouvement enregistré ✓</p>}

      <button type="submit" disabled={enCours} className="btn-primary w-full">
        {enCours ? 'Enregistrement...' : 'Enregistrer le mouvement'}
      </button>
    </form>
  )
}
