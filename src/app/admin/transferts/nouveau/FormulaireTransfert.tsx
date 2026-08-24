'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { creerTransfert } from '../actions'

interface Article { id: string; nom: string; quantite_stock: number }
interface LigneChoisie { article_id: string; nom_article: string; quantite: number; stock_disponible: number }

export default function FormulaireTransfert({ boutiques }: { boutiques: { id: string; nom: string }[] }) {
  const [boutiqueSource, setBoutiqueSource] = useState('')
  const [boutiqueDestination, setBoutiqueDestination] = useState('')
  const [articlesSource, setArticlesSource] = useState<Article[]>([])
  const [articleChoisi, setArticleChoisi] = useState('')
  const [quantite, setQuantite] = useState(1)
  const [lignes, setLignes] = useState<LigneChoisie[]>([])
  const [erreur, setErreur] = useState('')
  const [enCours, demarrer] = useTransition()

  async function chargerArticlesSource(boutiqueId: string) {
    setBoutiqueSource(boutiqueId)
    setLignes([])
    if (!boutiqueId) { setArticlesSource([]); return }
    const supabase = createClient()
    const { data } = await supabase.from('articles').select('id, nom, quantite_stock').eq('boutique_id', boutiqueId).eq('actif', true).gt('quantite_stock', 0)
    setArticlesSource(data ?? [])
  }

  function ajouterLigne() {
    const article = articlesSource.find((a) => a.id === articleChoisi)
    if (!article) return
    if (quantite > article.quantite_stock) {
      setErreur(`Stock insuffisant : ${article.quantite_stock} disponible(s).`)
      return
    }
    setErreur('')
    setLignes((prev) => {
      const existant = prev.find((l) => l.article_id === article.id)
      if (existant) return prev.map((l) => l.article_id === article.id ? { ...l, quantite: l.quantite + quantite } : l)
      return [...prev, { article_id: article.id, nom_article: article.nom, quantite, stock_disponible: article.quantite_stock }]
    })
    setArticleChoisi('')
    setQuantite(1)
  }

  function retirerLigne(articleId: string) {
    setLignes((prev) => prev.filter((l) => l.article_id !== articleId))
  }

  function soumettre() {
    setErreur('')
    demarrer(async () => {
      try {
        await creerTransfert(boutiqueSource, boutiqueDestination, lignes)
      } catch (err: any) {
        setErreur(err.message ?? 'Erreur lors de la création du transfert.')
      }
    })
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Boutique source</label>
          <select value={boutiqueSource} onChange={(e) => chargerArticlesSource(e.target.value)} className="input-field">
            <option value="">Sélectionner...</option>
            {boutiques.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Boutique destination</label>
          <select value={boutiqueDestination} onChange={(e) => setBoutiqueDestination(e.target.value)} className="input-field">
            <option value="">Sélectionner...</option>
            {boutiques.filter((b) => b.id !== boutiqueSource).map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
          </select>
        </div>
      </div>

      {boutiqueSource && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-700 text-sm">Ajouter des articles</h3>
          <div className="flex gap-2">
            <select value={articleChoisi} onChange={(e) => setArticleChoisi(e.target.value)} className="input-field">
              <option value="">Choisir un article...</option>
              {articlesSource.map((a) => <option key={a.id} value={a.id}>{a.nom} (stock : {a.quantite_stock})</option>)}
            </select>
            <input type="number" min={1} value={quantite} onChange={(e) => setQuantite(Number(e.target.value))} className="input-field w-24" />
            <button type="button" onClick={ajouterLigne} className="btn-secondary whitespace-nowrap">Ajouter</button>
          </div>
        </div>
      )}

      {lignes.length > 0 && (
        <div className="card divide-y">
          {lignes.map((l) => (
            <div key={l.article_id} className="flex justify-between items-center py-2 text-sm">
              <span>{l.nom_article} × {l.quantite}</span>
              <button onClick={() => retirerLigne(l.article_id)} className="text-red-500 text-xs hover:underline">Retirer</button>
            </div>
          ))}
        </div>
      )}

      {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

      <button
        onClick={soumettre}
        disabled={enCours || !boutiqueSource || !boutiqueDestination || lignes.length === 0}
        className="btn-primary w-full disabled:opacity-40"
      >
        {enCours ? 'Envoi...' : 'Expédier le transfert'}
      </button>
    </div>
  )
}
