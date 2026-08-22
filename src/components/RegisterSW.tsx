'use client'

import { useEffect } from 'react'
import { synchroniser } from '@/lib/sync'

export default function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
    synchroniser()
    window.addEventListener('online', synchroniser)
    return () => window.removeEventListener('online', synchroniser)
  }, [])

  return null
}
