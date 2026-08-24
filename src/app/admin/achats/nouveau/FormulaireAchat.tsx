'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { creerAchat } from '../actions'

interface Article { id: string; nom: string; prix_achat: number }
interface LigneChoisie { article_id: string; nom_article: string; quantite: number; prix_achat: number }

export default function FormulaireAchat({ fournisseurs, boutiques }: { fournisseurs: { id: string; nom: string }[]; boutiques: { id: string; nom: string }[] }) {
  const [fournisseurId, setFournisseurId] = useState('')
  const [boutiqueId, setBoutiqueId] = useState('')
  const [articlesBoutique, setArticlesBoutique] = useState<Article[]>([])
  const [articleChoisi, setArticleChoisi] = useState('')
  const [quantite, setQuantite] = useState(1)
  const [prixAchat, setPrixAchat] = useState(0)
  const [lignes, setLignes] = useState<LigneChoisie[]>([])
  const [erreur, setErreur] = useState('')
  const [enCours, demarrer] = useTransition()

  async function chargerArticles(id: string) {
    setBoutiqueId(id)
    setLignes([])
    if (!id) { setArticlesBoutique([]); return }
    const supabase = createClient()
    const { data } = await supabase.from('articles').select('id, nom, prix_achat').eq('boutique_id', id).eq('actif', true)
    setArticlesBoutique(data ?? [])
  }

  function choisirArticle(id: string) {
    setArticleChoisi(id)
    const article = articlesBoutique.find((a) => a.id === id)
    if (article) setPrixAchat(article.prix_achat)
  }

  function ajouterLigne() {
    const article = articlesBoutique.find((a) => a.id === articleChoisi)
    if (!article) return
    setLignes((prev) => [...prev, { article_id: article.id, nom_article: article.nom, quantite, prix_achat: prixAchat }])
    setArticleChoisi('')
    setQuantite(1)
  }

  const montantTotal = lignes.reduce((s, l) => s + l.quantite * l.prix_achat, 0)

  function soumettre() {
    setErreur('')
    demarrer(async () => {
      try {
        await creerAchat(fournisseurId, boutiqueId, lignes)
      } catch (err: any) {
        setErreur(err.message ?? 'Erreur lors de la création.')
      }
    })
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
          <select value={fournisseurId} onChange={(e) => setFournisseurId(e.target.value)} className="input-field">
            <option value="">Sélectionner...</option>
            {fournisseurs.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Boutique destinataire</label>
          <select value={boutiqueId} onChange={(e) => chargerArticles(e.target.value)} className="input-field">
            <option value="">Sélectionner...</option>
            {boutiques.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
          </select>
        </div>
      </div>

      {boutiqueId && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-700 text-sm">Ajouter des articles</h3>
          <select value={articleChoisi} onChange={(e) => choisirArticle(e.target.value)} className="input-field">
            <option value="">Choisir un article...</option>
            {articlesBoutique.map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}
          </select>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Quantité</label>
              <input type="number" min={1} value={quantite} onChange={(e) => setQuantite(Number(e.target.value))} className="input-field" />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Prix d'achat unitaire</label>
              <input type="number" min={0} value={prixAchat} onChange={(e) => setPrixAchat(Number(e.target.value))} className="input-field" />
            </div>
          </div>
          <button type="button" onClick={ajouterLigne} disabled={!articleChoisi} className="btn-secondary w-full disabled:opacity-40">Ajouter à la commande</button>
        </div>
      )}

      {lignes.length > 0 && (
        <div className="card divide-y">
          {lignes.map((l, i) => (
            <div key={i} className="flex justify-between py-2 text-sm">
              <span>{l.nom_article} × {l.quantite}</span>
              <span>{(l.quantite * l.prix_achat).toLocaleString('fr-FR')} FCFA</span>
            </div>
          ))}
          <div className="flex justify-between py-2 text-sm font-bold">
            <span>Total</span><span>{montantTotal.toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>
      )}

      {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

      <button onClick={soumettre} disabled={enCours || !fournisseurId || !boutiqueId || lignes.length === 0} className="btn-primary w-full disabled:opacity-40">
        {enCours ? 'Envoi...' : 'Passer la commande'}
      </button>
    </div>
  )
}
