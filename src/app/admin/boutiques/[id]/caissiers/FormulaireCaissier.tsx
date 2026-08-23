'use client'

import { useState, useTransition } from 'react'
import { creerCaissier } from '../../actions'

function genererMotDePasseTemporaire() {
  // Mot de passe temporaire lisible, à communiquer au caissier puis à changer à sa première connexion
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let resultat = ''
  for (let i = 0; i < 10; i++) resultat += caracteres[Math.floor(Math.random() * caracteres.length)]
  return resultat
}

export default function FormulaireCaissier({ boutiqueId }: { boutiqueId: string }) {
  const [nomComplet, setNomComplet] = useState('')
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState(genererMotDePasseTemporaire())
  const [erreur, setErreur] = useState('')
  const [creeAvecSucces, setCreeAvecSucces] = useState<{ email: string; motDePasse: string } | null>(null)
  const [enCours, demarrer] = useTransition()

  function soumettre(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    demarrer(async () => {
      try {
        await creerCaissier({ email, motDePasse, nomComplet, boutiqueId })
        setCreeAvecSucces({ email, motDePasse })
        setNomComplet('')
        setEmail('')
        setMotDePasse(genererMotDePasseTemporaire())
      } catch (err: any) {
        setErreur(err.message ?? 'Erreur lors de la création du compte.')
      }
    })
  }

  return (
    <div className="space-y-3">
      {creeAvecSucces && (
        <div className="card border-green-200 bg-green-50 text-sm space-y-1">
          <p className="font-medium text-green-700">Compte créé ✓</p>
          <p className="text-gray-600">Communiquez ces identifiants au caissier (il pourra changer le mot de passe ensuite) :</p>
          <p className="font-mono text-xs">{creeAvecSucces.email}</p>
          <p className="font-mono text-xs">{creeAvecSucces.motDePasse}</p>
        </div>
      )}

      <form onSubmit={soumettre} className="card space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
          <input required value={nomComplet} onChange={(e) => setNomComplet(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe temporaire</label>
          <input required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} className="input-field font-mono text-sm" />
          <p className="text-xs text-gray-400 mt-1">Généré automatiquement, modifiable avant validation.</p>
        </div>

        {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

        <button type="submit" disabled={enCours} className="btn-primary w-full">
          {enCours ? 'Création...' : 'Créer le compte caissier'}
        </button>
      </form>
    </div>
  )
}
