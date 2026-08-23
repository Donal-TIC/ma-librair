import Link from 'next/link'
import { IconeLibrairie, IconeTableauDeBord, IconePanier, IconeDepense } from '@/components/icones'

export default function CaisseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-primary-700 text-white px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconeLibrairie className="w-6 h-6" />
          <h1 className="font-bold text-lg">Ma librair — Caisse</h1>
        </div>
        <nav className="flex gap-4 text-sm">
          <Link href="/caisse" className="flex items-center gap-1.5 hover:underline">
            <IconeTableauDeBord className="w-4 h-4" /> Accueil
          </Link>
          <Link href="/caisse/vente" className="flex items-center gap-1.5 hover:underline">
            <IconePanier className="w-4 h-4" /> Vente
          </Link>
          <Link href="/caisse/depenses" className="flex items-center gap-1.5 hover:underline">
            <IconeDepense className="w-4 h-4" /> Dépenses
          </Link>
        </nav>
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}
