'use client'

import { useState, useTransition } from 'react'
import type { ArticleFormData } from '@/app/admin/articles/actions'

interface Props {
  boutiques: { id: string; nom: string }[]
  categories: { id: string; nom: string }[]
  fournisseurs: { id: string; nom: string }[]
  valeursInitiales?: Partial<ArticleFormData>
  codeBarre?: string
  onValider: (donnees: ArticleFormData) => Promise<void>
  libelleBouton: string
}

export default function ArticleForm({ boutiques, categories, fournisseurs, valeursInitiales, codeBarre, onValider, libelleBouton }: Props) {
  const [form, setForm] = useState<ArticleFormData>({
    boutique_id: valeursInitiales?.boutique_id ?? boutiques[0]?.id ?? '',
    categorie_id: valeursInitiales?.categorie_id ?? null,
    fournisseur_id: valeursInitiales?.fournisseur_id ?? null,
    nom: valeursInitiales?.nom ?? '',
    description: valeursInitiales?.description ?? '',
    prix_achat: valeursInitiales?.prix_achat ?? 0,
    prix_vente: valeursInitiales?.prix_vente ?? 0,
    quantite_stock: valeursInitiales?.quantite_stock ?? 0,
    seuil_alerte: valeursInitiales?.seuil_alerte ?? 5,
    image_url: null,
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
        setErreur(err.message ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <form onSubmit={soumettre} className="card space-y-4 max-w-xl">
      {codeBarre && (
        <p className="text-xs text-gray-400 font-mono">Code-barre : {codeBarre} (généré automatiquement)</p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Boutique</label>
        <select
          required
          value={form.boutique_id}
          onChange={(e) => setForm({ ...form, boutique_id: e.target.value })}
          className="input-field"
        >
          {boutiques.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'article</label>
        <input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="input-field" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
          <select value={form.categorie_id ?? ''} onChange={(e) => setForm({ ...form, categorie_id: e.target.value || null })} className="input-field">
            <option value="">Aucune</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
          <select value={form.fournisseur_id ?? ''} onChange={(e) => setForm({ ...form, fournisseur_id: e.target.value || null })} className="input-field">
            <option value="">Aucun</option>
            {fournisseurs.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prix d'achat (FCFA)</label>
          <input required type="number" step="0.01" min="0" value={form.prix_achat} onChange={(e) => setForm({ ...form, prix_achat: Number(e.target.value) })} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prix de vente (FCFA)</label>
          <input required type="number" step="0.01" min="0" value={form.prix_vente} onChange={(e) => setForm({ ...form, prix_vente: Number(e.target.value) })} className="input-field" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantité en stock</label>
          <input required type="number" min="0" value={form.quantite_stock} onChange={(e) => setForm({ ...form, quantite_stock: Number(e.target.value) })} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Seuil d'alerte stock bas</label>
          <input required type="number" min="0" value={form.seuil_alerte} onChange={(e) => setForm({ ...form, seuil_alerte: Number(e.target.value) })} className="input-field" />
        </div>
      </div>

      {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

      <button type="submit" disabled={enCours} className="btn-primary w-full">
        {enCours ? 'Enregistrement...' : libelleBouton}
      </button>
    </form>
  )
}
