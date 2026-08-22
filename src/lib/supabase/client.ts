import { createBrowserClient } from '@supabase/ssr'

// Ces deux variables viennent du fichier .env.local (voir .env.local.example)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
