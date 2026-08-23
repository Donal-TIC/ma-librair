'use client'

import { useState } from 'react'
import { offlineDB, type ArticleCache } from '@/lib/offline-db'
import { createClient } from '@/lib/supabase/client'
import { rechercherOuCreerClient } from '../actions'
import ScannerCodeBarre from '@/components/ScannerCodeBarre'
import { IconePoubelle, IconePlus, IconeMoins, IconePanier } from '@/components/icones'

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

export default function PageVenteClient({ sessionId, boutiqueId, caissierId }: { sessionId: string; boutiqueId: string; caissierId: string }) {
  const [codeBarre, setCodeBarre] = useState('')
  const [panier, setPanier] = useState<LignePanier[]>([])

  const [articleTrouve, setArticleTrouve] = useState<ArticleCache | null>(null)
  const [quantite, setQuantite] = useState(1)
  const [venteEnGros, setVenteEnGros] = useState(false)
  const [prixGros, setPrixGros] = useState(0)

  const [nomClient, setNomClient] = useState('')
  const [telephoneClient, setTelephoneClient] = useState('')

  const [paiementEspeces, setPaiementEspeces] = useState(0)
  const [paiementCarte, setPaiementCarte] = useState(0)
  const [paiementMobileMoney, setPaiementMobileMoney] = useState(0)

  const total = panier.reduce((s, l) => s + l.sous_total, 0)
  const nombreArticles = panier.reduce((s, l) => s + l.quantite, 0)
  const totalPaye = paiementEspeces + paiementCarte + paiementMobileMoney
  const monnaie = totalPaye - total

  const beneficeNormal = articleTrouve ? articleTrouve.prix_vente - articleTrouve.prix_achat : 0
  const beneficeApplique = articleTrouve ? prixGros - articleTrouve.prix_achat : 0
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
    setArticleTrouve(article)
    setQuantite(1)
    setVenteEnGros(false)
    setPrixGros(article.prix_vente)
    setCodeBarre('')
  }

  function ajouterAuPanier() {
    if (!articleTrouve) return
    const prixApplique = venteEnGros ? prixGros : articleTrouve.prix_vente

    // Notification stock insuffisant : on compare à la quantité déjà mise dans le panier
    const dejaAuPanier = panier
      .filter((l) => l.article_id === articleTrouve.id)
      .reduce((s, l) => s + l.quantite, 0)
    if (dejaAuPanier + quantite > articleTrouve.quantite_stock) {
      alert(`Stock insuffisant : il ne reste que ${articleTrouve.quantite_stock} unité(s) de "${articleTrouve.nom}" (dont ${dejaAuPanier} déjà dans le panier).`)
      return
    }

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

  function changerQuantiteLigne(index: number, delta: number) {
    setPanier((prev) => {
      const copie = [...prev]
      const ligne = copie[index]
      const nouvelleQuantite = ligne.quantite + delta
      if (nouvelleQuantite <= 0) {
        copie.splice(index, 1)
        return copie
      }
      copie[index] = { ...ligne, quantite: nouvelleQuantite, sous_total: nouvelleQuantite * ligne.prix_unitaire }
      return copie
    })
  }

  function supprimerLigne(index: number) {
    setPanier((prev) => prev.filter((_, i) => i !== index))
  }

  function viderPanier() {
    if (panier.length === 0) return
    if (window.confirm('Vider entièrement le panier ?')) setPanier([])
  }

  async function validerVente() {
    if (panier.length === 0) return
    if (totalPaye < total) {
      alert('Le montant payé est inférieur au total. Complétez le paiement avant de valider.')
      return
    }

    // Notification "session expirée" : on vérifie que la session est toujours ouverte
    // avant d'enregistrer la vente (uniquement possible si le réseau est disponible ;
    // hors-ligne, la vente continue normalement et sera vérifiée à la synchronisation).
    if (navigator.onLine) {
      const supabase = createClient()
      const { data: sessionActuelle } = await supabase.from('sessions_caisse').select('statut').eq('id', sessionId).maybeSingle()
      if (sessionActuelle && sessionActuelle.statut !== 'ouverte') {
        alert("Votre session de caisse a été fermée. Ouvrez une nouvelle session avant de continuer à vendre.")
        return
      }
    }

    // Rattachement du client (facultatif) — ne bloque jamais la vente si ça échoue (ex : hors-ligne)
    let clientId: string | null = null
    if (nomClient.trim()) {
      try {
        const client = await rechercherOuCreerClient(boutiqueId, nomClient.trim(), telephoneClient.trim())
        clientId = client.id
      } catch {
        // Pas de connexion ou erreur : la vente continue quand même, sans client rattaché
      }
    }

    const paiements = [
      { mode: 'especes' as const, montant: paiementEspeces },
      { mode: 'carte' as const, montant: paiementCarte },
      { mode: 'mobile_money' as const, montant: paiementMobileMoney },
    ].filter((p) => p.montant > 0)

    const numeroRecu = `REC-${Date.now()}`

    await offlineDB.ventes.add({
      uuid: crypto.randomUUID(),
      boutique_id: boutiqueId,
      caissier_id: caissierId,
      session_id: sessionId,
      client_id: clientId,
      numero_recu: numeroRecu,
      montant_total: total,
      montant_paye: totalPaye,
      monnaie_rendue: monnaie,
      paiements,
      lignes: panier,
      created_at: new Date().toISOString(),
      synced: false,
    })

    window.print()

    setPanier([])
    setPaiementEspeces(0)
    setPaiementCarte(0)
    setPaiementMobileMoney(0)
    setNomClient('')
    setTelephoneClient('')
  }

  return (
    <div className="max-w-md mx-auto pb-32">
      <form onSubmit={(e) => { e.preventDefault(); rechercherArticle(codeBarre) }} className="flex gap-2">
        <input autoFocus value={codeBarre} onChange={(e) => setCodeBarre(e.target.value)} placeholder="Saisir le code-barre" className="input-field" />
        <button type="submit" className="btn-primary whitespace-nowrap">Rechercher</button>
      </form>

      <div className="mt-3">
        <ScannerCodeBarre onCodeDetecte={rechercherArticle} />
      </div>

      {articleTrouve && (
        <div className="card space-y-3 border-primary-200 mt-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold">{articleTrouve.nom}</p>
              <p className="text-sm text-gray-500">Prix normal : {articleTrouve.prix_vente.toLocaleString('fr-FR')} FCFA</p>
            </div>
            <button onClick={() => setArticleTrouve(null)} className="text-gray-400 text-sm">✕</button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setQuantite((q) => Math.max(1, q - 1))} className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">
                <IconeMoins />
              </button>
              <span className="w-10 text-center font-medium">{quantite}</span>
              <button type="button" onClick={() => setQuantite((q) => q + 1)} className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">
                <IconePlus />
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={venteEnGros} onChange={(e) => { setVenteEnGros(e.target.checked); setPrixGros(articleTrouve.prix_vente) }} />
            Vente en gros (prix négocié)
          </label>

          {venteEnGros && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire négocié (FCFA)</label>
              <input type="number" min={0} value={prixGros} onChange={(e) => setPrixGros(Number(e.target.value))} className="input-field" />
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

      <div className="mt-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <IconePanier className="w-4 h-4" /> Panier ({nombreArticles})
        </h3>
        {panier.length > 0 && <button onClick={viderPanier} className="text-xs text-red-500 hover:underline">Vider le panier</button>}
      </div>

      <div className="card divide-y mt-2">
        {panier.length === 0 && <p className="text-gray-400 text-sm py-4 text-center">Panier vide</p>}
        {panier.map((l, i) => (
          <div key={i} className="flex items-center justify-between py-2.5 text-sm gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium">
                {l.nom_article}
                {l.est_gros && <span className="text-primary-600 text-xs ml-1">(prix de gros)</span>}
              </p>
              <p className="text-gray-400 text-xs">{l.prix_unitaire.toLocaleString('fr-FR')} FCFA / unité</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => changerQuantiteLigne(i, -1)} className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"><IconeMoins className="w-3.5 h-3.5" /></button>
              <span className="w-6 text-center">{l.quantite}</span>
              <button onClick={() => changerQuantiteLigne(i, 1)} className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"><IconePlus className="w-3.5 h-3.5" /></button>
              <span className="font-medium w-20 text-right">{l.sous_total.toLocaleString('fr-FR')}</span>
              <button onClick={() => supprimerLigne(i)} className="text-gray-300 hover:text-red-500 ml-1"><IconePoubelle /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="card mt-4 space-y-3">
        <h3 className="font-semibold text-gray-700 text-sm">Client (facultatif)</h3>
        <div className="grid grid-cols-2 gap-2">
          <input value={nomClient} onChange={(e) => setNomClient(e.target.value)} placeholder="Nom du client" className="input-field" />
          <input value={telephoneClient} onChange={(e) => setTelephoneClient(e.target.value)} placeholder="Téléphone" className="input-field" />
        </div>
      </div>

      <div className="card mt-4 space-y-3">
        <h3 className="font-semibold text-gray-700 text-sm">Paiement</h3>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Espèces</label>
          <input type="number" min={0} value={paiementEspeces || ''} onChange={(e) => setPaiementEspeces(Number(e.target.value))} className="input-field" placeholder="0" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Carte</label>
          <input type="number" min={0} value={paiementCarte || ''} onChange={(e) => setPaiementCarte(Number(e.target.value))} className="input-field" placeholder="0" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Mobile Money</label>
          <input type="number" min={0} value={paiementMobileMoney || ''} onChange={(e) => setPaiementMobileMoney(Number(e.target.value))} className="input-field" placeholder="0" />
        </div>
        {totalPaye > 0 && (
          <p className={`text-sm ${monnaie < 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {monnaie < 0 ? `Il manque ${Math.abs(monnaie).toLocaleString('fr-FR')} FCFA` : `Monnaie à rendre : ${monnaie.toLocaleString('fr-FR')} FCFA`}
          </p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between font-bold text-lg mb-2">
            <span>Total</span>
            <span className="text-primary-700">{total.toLocaleString('fr-FR')} FCFA</span>
          </div>
          <button onClick={validerVente} disabled={panier.length === 0} className="btn-primary w-full disabled:opacity-40">
            Valider la vente et imprimer le reçu
          </button>
        </div>
      </div>
    </div>
  )
}
