import Link from 'next/link'

const liens = [
  { href: '/admin', label: 'Tableau de bord' },
  { href: '/admin/boutiques', label: 'Boutiques & caisses' },
  { href: '/admin/articles', label: 'Articles & stock' },
  { href: '/admin/stock', label: 'Mouvements de stock' },
  { href: '/admin/finances', label: 'Finances' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-primary-700 text-white flex flex-col">
        <div className="px-5 py-6">
          <h1 className="text-xl font-bold">Ma librair</h1>
          <p className="text-primary-200 text-xs mt-1">Espace administrateur</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {liens.map((lien) => (
            <Link
              key={lien.href}
              href={lien.href}
              className="block px-3 py-2 rounded-lg text-sm text-primary-50 hover:bg-primary-600 transition-colors"
            >
              {lien.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 bg-primary-50/40 p-6">{children}</main>
    </div>
  )
}
