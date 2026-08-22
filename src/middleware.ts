import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const chemin = request.nextUrl.pathname

  // Pages protégées : /admin/* et /caisse/*
  const estZoneProtegee = chemin.startsWith('/admin') || chemin.startsWith('/caisse')

  if (estZoneProtegee && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && estZoneProtegee) {
    const { data: profil } = await supabase
      .from('profils')
      .select('role')
      .eq('id', user.id)
      .single()

    // Un caissier ne peut pas accéder à /admin, et inversement pas de blocage strict
    // pour l'admin sur /caisse (il peut superviser), à ajuster selon besoin.
    if (chemin.startsWith('/admin') && profil?.role !== 'admin') {
      return NextResponse.redirect(new URL('/caisse', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/caisse/:path*'],
}
