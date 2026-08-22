'use client'

import { useState } from 'react'
import { offlineDB, type ArticleCache } from '@/lib/offline-db'
import ScannerCodeBarre from '@/components/ScannerCodeBarre'

interface LignePanier {
  article_id: string
  nom_article: string
  prix_unitaire: number
  quantite: number
  sous_total: number
  est_gros: boolean
  prix_reference: number
  prix_achat_reference: number
}

export default function PageVente() {
  const [codeBarre, setCodeBarre] = useState('')
  const [panier, setPanier] = useState<LignePanier[]>([])
  const [montantPaye, setMontantPaye] = useState<number>(0)

  // Fiche de l'article trouvé, en attente de confirmation avant ajout au panier
  const [articleTrouve, setArticleTrouve] = useState<ArticleCache | null>(null)
  const [quantite, setQuantite] = useState(1)
  const [venteEnGros, setVenteEnGros] = useState(false)
  const [prixGros, setPrixGros] = useState(0)

  const total = panier.reduce((s, l) => s + l.sous_total, 0)
  const monnaie = montantPaye - total

  // Bénéfice normalement attendu par la boutique sur cet article (prix vente - prix achat)
  const beneficeNormal = articleTrouve ? articleTrouve.prix_vente - articleTrouve.prix_achat : 0
  // Bénéfice réellement obtenu si on applique le prix négocié
  const beneficeApplique = articleTrouve ? prixGros - articleTrouve.prix_achat : 0
  // Signal si le bénéfice obtenu descend sous 10% du bénéfice normalement attendu
  const remiseExcessive = venteEnGros && articleTrouve && beneficeNormal > 0
    ? beneficeApplique < beneficeNormal * 0.1
    : false

  async function rechercherArticle(code: string) {
    const article = await offlineDB.articles_cache.where('code_barre').equals(code).first()
    if (!article) {
      alert("Aucun article ne correspond à ce code-barre.")
      setCodeBarre('')
      return
    }
    // Les champs se remplissent automatiquement à partir de l'article trouvé
    setArticleTrouve(article)
    setQuantite(1)
    setVenteEnGros(false)
    setPrixGros(article.prix_vente)
    setCodeBarre('')
  }

  function ajouterAuPanier() {
    if (!articleTrouve) return
    const prixApplique = venteEnGros ? prixGros : articleTrouve.prix_vente

    setPanier((prev) => {
      const existant = prev.find((l) => l.article_id === articleTrouve.id && l.est_gros === venteEnGros && l.prix_unitaire === prixApplique)
      if (existant) {
        return prev.map((l) =>
          l === existant
            ? { ...l, quantite: l.quantite + quantite, sous_total: (l.quantite + quantite) * prixApplique }
            : l
        )
      }
      return [
        ...prev,
        {
          article_id: articleTrouve.id,
          nom_article: articleTrouve.nom,
          prix_unitaire: prixApplique,
          quantite,
          sous_total: prixApplique * quantite,
          est_gros: venteEnGros,
          prix_reference: articleTrouve.prix_vente,
          prix_achat_reference: articleTrouve.prix_achat,
        },
      ]
    })
    setArticleTrouve(null)
  }

  async function validerVente() {
    if (panier.length === 0) return

    // TODO: remplacer par le vrai boutique_id / caissier_id de la session connectée
    const numeroRecu = `REC-${Date.now()}`

    await offlineDB.ventes.add({
      uuid: crypto.randomUUID(),
      boutique_id: 'A_DEFINIR',
      caissier_id: 'A_DEFINIR',
      numero_recu: numeroRecu,
      montant_total: total,
      montant_paye: montantPaye,
      monnaie_rendue: monnaie,
      mode_paiement: 'especes',
      lignes: panier,
      created_at: new Date().toISOString(),
      synced: false,
    })

    window.print() // ouvre l'impression du reçu (compatible imprimante Bluetooth/USB)

    setPanier([])
    setMontantPaye(0)
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); rechercherArticle(codeBarre) }} className="flex gap-2">
        <input
          autoFocus
          value={codeBarre}
          onChange={(e) => setCodeBarre(e.target.value)}
          placeholder="Saisir le code-barre"
          className="input-field"
        />
        <button type="submit" className="btn-primary whitespace-nowrap">Rechercher</button>
      </form>

      <ScannerCodeBarre onCodeDetecte={rechercherArticle} />

      {/* Fiche article : apparaît une fois le code trouvé (saisie ou scan) */}
      {articleTrouve && (
        <div className="card space-y-3 border-primary-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold">{articleTrouve.nom}</p>
              <p className="text-sm text-gray-500">Prix normal : {articleTrouve.prix_vente.toLocaleString('fr-FR')} FCFA</p>
            </div>
            <button onClick={() => setArticleTrouve(null)} className="text-gray-400 text-sm">✕</button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
            <input type="number" min={1} value={quantite} onChange={(e) => setQuantite(Number(e.target.value))} className="input-field" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={venteEnGros} onChange={(e) => { setVenteEnGros(e.target.checked); setPrixGros(articleTrouve.prix_vente) }} />
            Vente en gros (prix négocié)
          </label>

          {venteEnGros && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire négocié (FCFA)</label>
              <input
                type="number"
                min={0}
                value={prixGros}
                onChange={(e) => setPrixGros(Number(e.target.value))}
                className="input-field"
              />
              {remiseExcessive && (
                <p className="text-red-600 text-xs mt-1">
                  Bénéfice trop faible : ce prix fait descendre le bénéfice sous 10% de celui normalement attendu par la boutique sur cet article.
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Total pour {quantite} article{quantite > 1 ? 's' : ''} : {(prixGros * quantite).toLocaleString('fr-FR')} FCFA
              </p>
            </div>
          )}

          <button onClick={ajouterAuPanier} className="btn-primary w-full">Ajouter au panier</button>
        </div>
      )}

      <div className="card divide-y">
        {panier.length === 0 && <p className="text-gray-400 text-sm py-4 text-center">Panier vide</p>}
        {panier.map((l, i) => (
          <div key={i} className="flex justify-between py-2 text-sm">
            <span>
              {l.nom_article} × {l.quantite}
              {l.est_gros && <span className="text-primary-600 text-xs ml-1">(prix de gros)</span>}
            </span>
            <span className="font-medium">{l.sous_total.toLocaleString('fr-FR')} FCFA</span>
          </div>
        ))}
      </div>

      <div className="card space-y-2">
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span className="text-primary-700">{total.toLocaleString('fr-FR')} FCFA</span>
        </div>
        <input
          type="number"
          value={montantPaye || ''}
          onChange={(e) => setMontantPaye(Number(e.target.value))}
          placeholder="Montant payé par le client"
          className="input-field"
        />
        {montantPaye > 0 && (
          <p className="text-sm text-gray-500">Monnaie à rendre : {monnaie.toLocaleString('fr-FR')} FCFA</p>
        )}
        <button onClick={validerVente} className="btn-primary w-full">
          Valider la vente et imprimer le reçu
        </button>
      </div>
    </div>
  )
}
