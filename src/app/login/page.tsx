'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse,
    })

    if (error) {
      setErreur("Identifiants incorrects. Vérifiez votre email et mot de passe.")
      setChargement(false)
      return
    }

    // On récupère le profil pour savoir où rediriger l'utilisateur
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

    if (profil?.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/caisse')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-primary-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-700">Ma librair</h1>
          <p className="text-gray-500 mt-1">Connectez-vous à votre espace</p>
        </div>

        <form onSubmit={seConnecter} className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="vous@exemple.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

          <button type="submit" disabled={chargement} className="btn-primary w-full">
            {chargement ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </main>
  )
}
