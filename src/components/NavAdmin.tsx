'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconeLibrairie, IconeTableauDeBord, IconeBoutique, IconeArticle, IconeStock, IconeFinances, IconeTransfert, IconeInventaire, IconeUtilisateurs, IconeAchat, IconePanier, IconeRecherche, IconeMenu, IconeFermer } from './icones'
import BoutonDeconnexion from './BoutonDeconnexion'

const liens = [
  { href: '/admin', label: 'Tableau de bord', Icone: IconeTableauDeBord },
  { href: '/admin/recherche', label: 'Recherche', Icone: IconeRecherche },
  { href: '/admin/boutiques', label: 'Boutiques & caisses', Icone: IconeBoutique },
  { href: '/admin/ventes', label: 'Ventes', Icone: IconePanier },
  { href: '/admin/articles', label: 'Articles & stock', Icone: IconeArticle },
  { href: '/admin/stock', label: 'Mouvements de stock', Icone: IconeStock },
  { href: '/admin/stock-global', label: 'Stock global', Icone: IconeStock },
  { href: '/admin/transferts', label: 'Transferts', Icone: IconeTransfert },
  { href: '/admin/inventaires', label: 'Inventaires', Icone: IconeInventaire },
  { href: '/admin/fournisseurs', label: 'Fournisseurs', Icone: IconeUtilisateurs },
  { href: '/admin/achats', label: 'Achats', Icone: IconeAchat },
  { href: '/admin/finances', label: 'Finances', Icone: IconeFinances },
]

export default function NavAdmin() {
  const [ouvert, setOuvert] = useState(false)
  const chemin = usePathname()

  return (
    <>
      {/* Barre du haut, visible uniquement sur mobile/tablette */}
      <div className="md:hidden flex items-center justify-between bg-primary-700 text-white px-4 py-3">
        <div className="flex items-center gap-2">
          <IconeLibrairie className="w-6 h-6" />
          <div>
            <h1 className="text-lg font-bold leading-tight">Ma librair</h1>
            <p className="text-primary-200 text-xs">Espace administrateur</p>
          </div>
        </div>
        <button
          onClick={() => setOuvert((o) => !o)}
          aria-label="Ouvrir le menu"
          className="p-2 -mr-2"
        >
          {ouvert ? <IconeFermer /> : <IconeMenu />}
        </button>
      </div>

      {/* Barre latérale : toujours visible sur écran moyen/grand, dépliable sur mobile */}
      <aside className={`${ouvert ? 'block' : 'hidden'} md:block w-full md:w-60 bg-primary-700 text-white md:flex md:flex-col md:min-h-screen`}>
        <div className="hidden md:flex items-center gap-2 px-5 py-6">
          <IconeLibrairie className="w-7 h-7" />
          <div>
            <h1 className="text-xl font-bold">Ma librair</h1>
            <p className="text-primary-200 text-xs mt-0.5">Espace administrateur</p>
          </div>
        </div>
        <nav className="px-3 py-2 md:py-0 md:flex-1 space-y-1">
          {liens.map((lien) => {
            const actif = chemin === lien.href
            return (
              <Link
                key={lien.href}
                href={lien.href}
                onClick={() => setOuvert(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  actif ? 'bg-primary-600 text-white font-medium' : 'text-primary-50 hover:bg-primary-600'
                }`}
              >
                <lien.Icone className="w-5 h-5 shrink-0" />
                {lien.label}
              </Link>
            )
          })}
        </nav>
        <div className="px-3 py-4 border-t border-primary-600/50 mt-2">
          <BoutonDeconnexion className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-primary-100 hover:bg-primary-600 w-full text-left" />
        </div>
      </aside>
    </>
  )
}
