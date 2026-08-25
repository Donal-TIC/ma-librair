import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "La librairie de Katiola — Gestion",
    template: "%s · La librairie de Katiola",
  },
  description: "Votre gestion de librairie, simple, rapide et professionnelle.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  robots: { index: false, follow: false }, // espace de gestion authentifié : non indexé
};

export const viewport: Viewport = {
  themeColor: "#237244",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
