'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { creerPromotion } from '../actions'

interface Article { id: string; nom: string }

export default function FormulairePromotion({ boutiques, categories }: { boutiques: { id: string; nom: string }[]; categories: { id: string; nom: string }[] }) {
  const [boutiqueId, setBoutiqueId] = useState('')
  const [cible, setCible] = useState<'article' | 'categorie'>('article')
  const [articlesBoutique, setArticlesBoutique] = useState<Article[]>([])
  const [articleId, setArticleId] = useState('')
  const [categorieId, setCategorieId] = useState('')
  const [type, setType] = useState<'pourcentage' | 'fixe'>('pourcentage')
  const [valeur, setValeur] = useState(10)
  const [dateDebut, setDateDebut] = useState(new Date().toISOString().slice(0, 10))
  const [dateFin, setDateFin] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, demarrer] = useTransition()

  async function chargerArticles(id: string) {
    setBoutiqueId(id)
    if (!id) { setArticlesBoutique([]); return }
    const supabase = createClient()
    const { data } = await supabase.from('articles').select('id, nom').eq('boutique_id', id).eq('actif', true)
    setArticlesBoutique(data ?? [])
  }

  function soumettre(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    demarrer(async () => {
      try {
        await creerPromotion({
          boutique_id: boutiqueId,
          article_id: cible === 'article' ? articleId : null,
          categorie_id: cible === 'categorie' ? categorieId : null,
          type,
          valeur,
          date_debut: dateDebut,
          date_fin: dateFin,
        })
      } catch (err: any) {
        setErreur(err.message ?? 'Erreur.')
      }
    })
  }

  return (
    <form onSubmit={soumettre} className="card space-y-4 max-w-xl">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Boutique</label>
        <select required value={boutiqueId} onChange={(e) => chargerArticles(e.target.value)} className="input-field">
          <option value="">Sélectionner...</option>
          {boutiques.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">S'applique à</label>
        <div className="flex gap-4 text-sm mb-2">
          <label className="flex items-center gap-1.5"><input type="radio" checked={cible === 'article'} onChange={() => setCible('article')} /> Un article précis</label>
          <label className="flex items-center gap-1.5"><input type="radio" checked={cible === 'categorie'} onChange={() => setCible('categorie')} /> Toute une catégorie</label>
        </div>
        {cible === 'article' ? (
          <select required value={articleId} onChange={(e) => setArticleId(e.target.value)} className="input-field">
            <option value="">Choisir un article...</option>
            {articlesBoutique.map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}
          </select>
        ) : (
          <select required value={categorieId} onChange={(e) => setCategorieId(e.target.value)} className="input-field">
            <option value="">Choisir une catégorie...</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type de remise</label>
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="input-field">
            <option value="pourcentage">Pourcentage (%)</option>
            <option value="fixe">Montant fixe (FCFA)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valeur</label>
          <input required type="number" min={0} value={valeur} onChange={(e) => setValeur(Number(e.target.value))} className="input-field" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
          <input required type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
          <input required type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="input-field" />
        </div>
      </div>

      {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

      <button type="submit" disabled={enCours} className="btn-primary w-full">
        {enCours ? 'Création...' : 'Créer la promotion'}
      </button>
    </form>
  )
}
