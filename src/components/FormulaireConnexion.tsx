'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { IconeLibrairie } from '@/components/icones'

interface Props {
  roleAttendu: 'admin' | 'caissier'
  titre: string
  destination: string
  libelleAutreRole: string
  lienAutreRole: string
}

export default function FormulaireConnexion({ roleAttendu, titre, destination, libelleAutreRole, lienAutreRole }: Props) {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)
  const router = useRouter()

  async function seConnecter(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    setChargement(true)
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: motDePasse })

    if (error) {
      setErreur("Identifiants incorrects. Vérifiez votre email et mot de passe.")
      setChargement(false)
      return
    }

    const { data: profil } = await supabase
      .from('profils')
      .select('role, actif')
      .eq('id', data.user.id)
      .single()

    if (profil && profil.actif === false) {
      await supabase.auth.signOut()
      setErreur("Ce compte a été désactivé. Contactez votre administrateur.")
      setChargement(false)
      return
    }

    // Vérification stricte : le compte doit correspondre à l'espace choisi
    if (profil?.role !== roleAttendu) {
      await supabase.auth.signOut()
      setErreur(
        roleAttendu === 'admin'
          ? "Ce compte n'est pas un compte administrateur. Utilisez l'accès Caissier."
          : "Ce compte n'est pas un compte caissier. Utilisez l'accès Administrateur."
      )
      setChargement(false)
      return
    }

    router.push(destination)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-primary-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary-600/20">
            <IconeLibrairie className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-primary-700">Ma librair</h1>
          <p className="text-gray-500 mt-1">{titre}</p>
        </div>

        <form onSubmit={seConnecter} className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="vous@exemple.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input type="password" required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} className="input-field" placeholder="••••••••" />
          </div>

          {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

          <button type="submit" disabled={chargement} className="btn-primary w-full">
            {chargement ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href={lienAutreRole} className="text-primary-600 hover:underline">{libelleAutreRole}</Link>
        </p>
      </div>
    </main>
  )
}
