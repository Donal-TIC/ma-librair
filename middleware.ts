import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Protection des routes :
 *  - /responsable/*  -> nécessite une session + rôle owner/manager (ou permission équivalente)
 *  - /caissier/*     -> nécessite une session valide
 *  - toute autre route protégée -> redirige vers la page d'accueil si non connecté
 *
 * Rappel : ce middleware est une commodité UX. La vraie sécurité est assurée
 * par les policies RLS Supabase, jamais par ce fichier seul.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isResponsableRoute = pathname.startsWith("/responsable");
  const isCaissierRoute = pathname.startsWith("/caissier");

  if ((isResponsableRoute || isCaissierRoute) && !user) {
    const loginPath = isResponsableRoute ? "/login/responsable" : "/login/caissier";
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  if (isResponsableRoute && user) {
    // Vérification légère du rôle pour l'UX (la vraie barrière reste RLS côté DB).
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_owner")
      .eq("id", user.id)
      .single();

    const { data: storeRoles } = await supabase
      .from("store_users")
      .select("role")
      .eq("user_id", user.id);

    const hasManagementRole =
      profile?.is_owner ||
      storeRoles?.some((r) => ["manager", "supervisor", "accountant", "stock_manager"].includes(r.role));

    if (!hasManagementRole) {
      return NextResponse.redirect(new URL("/caissier", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/responsable/:path*", "/caissier/:path*"],
};
