import NavAdmin from '@/components/NavAdmin'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:flex">
      <NavAdmin />
      <main className="flex-1 bg-primary-50/40 p-4 md:p-6 min-w-0">{children}</main>
    </div>
  )
}
