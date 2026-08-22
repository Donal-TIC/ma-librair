'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  onCodeDetecte: (code: string) => void
}

// Scanner caméra : dès qu'un code-barre est détecté, il est transmis au parent
// qui recherche l'article et remplit automatiquement les champs (nom, prix...).
export default function ScannerCodeBarre({ onCodeDetecte }: Props) {
  const [actif, setActif] = useState(false)
  const conteneurRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<any>(null)

  useEffect(() => {
    if (!actif) return

    let annule = false

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (annule || !conteneurRef.current) return
      const scanner = new Html5Qrcode(conteneurRef.current.id)
      scannerRef.current = scanner

      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 120 } },
          (codeDetecte: string) => {
            onCodeDetecte(codeDetecte)
            scanner.stop().catch(() => {})
            setActif(false)
          },
          () => {} // erreurs de lecture image par image, ignorées silencieusement
        )
        .catch(() => setActif(false))
    })

    return () => {
      annule = true
      scannerRef.current?.stop().catch(() => {})
    }
  }, [actif]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <button type="button" onClick={() => setActif((a) => !a)} className="btn-secondary text-sm w-full">
        {actif ? 'Arrêter la caméra' : '📷 Scanner avec la caméra'}
      </button>
      {actif && <div id="zone-scanner" ref={conteneurRef} className="mt-2 rounded-lg overflow-hidden" />}
    </div>
  )
}
