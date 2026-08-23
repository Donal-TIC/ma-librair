import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import RegisterSW from '@/components/RegisterSW'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Ma librair',
  description: "Application de gestion pour librairie — stock, ventes, caisses et finances",
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="bg-white text-gray-900 antialiased font-sans">
        <RegisterSW />
        {children}
      </body>
    </html>
  )
}
