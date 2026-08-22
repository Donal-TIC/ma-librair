import Link from 'next/link'

export default function CaisseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-primary-700 text-white px-5 py-4 flex items-center justify-between">
        <h1 className="font-bold text-lg">Ma librair — Caisse</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/caisse" className="hover:underline">Vente</Link>
          <Link href="/caisse/depenses" className="hover:underline">Dépenses</Link>
        </nav>
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}
