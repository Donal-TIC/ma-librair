'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const liens = [
  { href: '/admin', label: 'Tableau de bord' },
  { href: '/admin/boutiques', label: 'Boutiques & caisses' },
  { href: '/admin/articles', label: 'Articles & stock' },
  { href: '/admin/stock', label: 'Mouvements de stock' },
  { href: '/admin/finances', label: 'Finances' },
]

export default function NavAdmin() {
  const [ouvert, setOuvert] = useState(false)
  const chemin = usePathname()

  return (
    <>
      {/* Barre du haut, visible uniquement sur mobile/tablette */}
      <div className="md:hidden flex items-center justify-between bg-primary-700 text-white px-4 py-3">
        <div>
          <h1 className="text-lg font-bold leading-tight">Ma librair</h1>
          <p className="text-primary-200 text-xs">Espace administrateur</p>
        </div>
        <button
          onClick={() => setOuvert((o) => !o)}
          aria-label="Ouvrir le menu"
          className="p-2 -mr-2"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {ouvert ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Barre latérale : toujours visible sur écran moyen/grand, dépliable sur mobile */}
      <aside className={`${ouvert ? 'block' : 'hidden'} md:block w-full md:w-60 bg-primary-700 text-white md:flex md:flex-col md:min-h-screen`}>
        <div className="hidden md:block px-5 py-6">
          <h1 className="text-xl font-bold">Ma librair</h1>
          <p className="text-primary-200 text-xs mt-1">Espace administrateur</p>
        </div>
        <nav className="px-3 py-2 md:py-0 md:flex-1 space-y-1">
          {liens.map((lien) => {
            const actif = chemin === lien.href
            return (
              <Link
                key={lien.href}
                href={lien.href}
                onClick={() => setOuvert(false)}
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  actif ? 'bg-primary-600 text-white font-medium' : 'text-primary-50 hover:bg-primary-600'
                }`}
              >
                {lien.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
