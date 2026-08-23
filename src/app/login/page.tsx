import Link from 'next/link'
import { IconeLibrairie, IconeTableauDeBord, IconePanier } from '@/components/icones'

export default function ChoixConnexion() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-primary-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary-600/20">
          <IconeLibrairie className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-primary-700">Ma librair</h1>
        <p className="text-gray-500 mt-1 mb-8">Connectez-vous à votre espace</p>

        <div className="space-y-3">
          <Link href="/login/admin" className="card flex items-center gap-3 hover:border-primary-300 transition-colors text-left">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
              <IconeTableauDeBord className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Administrateur</p>
              <p className="text-xs text-gray-500">Gestion complète des boutiques</p>
            </div>
          </Link>

          <Link href="/login/caissier" className="card flex items-center gap-3 hover:border-primary-300 transition-colors text-left">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
              <IconePanier className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Caissier</p>
              <p className="text-xs text-gray-500">Accès à la caisse de votre boutique</p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}
