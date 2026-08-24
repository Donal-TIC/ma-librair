'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function BoutonDeconnexion({ className }: { className?: string }) {
  const [enCours, setEnCours] = useState(false)
  const router = useRouter()

  async function deconnecter() {
    setEnCours(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button onClick={deconnecter} disabled={enCours} className={className ?? 'text-sm text-red-500 hover:underline'}>
      {enCours ? 'Déconnexion...' : 'Se déconnecter'}
    </button>
  )
}
