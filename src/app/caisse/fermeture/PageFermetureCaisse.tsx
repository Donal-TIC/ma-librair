'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { fermerCaisse } from '../actions'

export default function PageFermetureCaisse({ sessionId }: { sessionId: string }) {
  const [montantCompte, setMontantCompte] = useState(0)
  const [resultat, setResultat] = useState<{ montantTheorique: number; ecart: number } | null>(null)
  const [erreur, setErreur] = useState('')
  const [enCours, demarrer] = useTransition()
  const router = useRouter()

  function soumettre(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    demarrer(async () => {
      try {
        const res = await fermerCaisse(sessionId, montantCompte)
        setResultat(res)
      } catch (err: any) {
        setErreur(err.message ?? 'Erreur lors de la fermeture.')
      }
    })
  }

  if (resultat) {
    const ecartPositif = resultat.ecart >= 0
    return (
      <div className="max-w-sm mx-auto mt-8 card space-y-3 text-center">
        <h2 className="text-xl font-bold text-gray-800">Caisse fermée</h2>
        <div className="text-left space-y-1 text-sm pt-2">
          <div className="flex justify-between"><span className="text-gray-500">Montant théorique</span><span>{resultat.montantTheorique.toLocaleString('fr-FR')} FCFA</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Montant compté</span><span>{montantCompte.toLocaleString('fr-FR')} FCFA</span></div>
          <div className={`flex justify-between font-bold ${resultat.ecart === 0 ? 'text-green-600' : ecartPositif ? 'text-orange-600' : 'text-red-600'}`}>
            <span>Écart</span>
            <span>{ecartPositif ? '+' : ''}{resultat.ecart.toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>
        <button onClick={() => { router.push('/caisse/ouverture'); router.refresh() }} className="btn-primary w-full mt-2">
          Ouvrir une nouvelle session
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto mt-8">
      <h2 className="text-xl font-bold text-gray-800 mb-1">Fermeture de caisse</h2>
      <p className="text-gray-500 text-sm mb-6">Comptez l'argent réellement présent en caisse.</p>

      <form onSubmit={soumettre} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Montant compté (FCFA)</label>
          <input required type="number" min={0} value={montantCompte || ''} onChange={(e) => setMontantCompte(Number(e.target.value))} className="input-field" autoFocus />
        </div>

        {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

        <button type="submit" disabled={enCours} className="btn-primary w-full">
          {enCours ? 'Calcul...' : 'Fermer la caisse'}
        </button>
      </form>
    </div>
  )
}
