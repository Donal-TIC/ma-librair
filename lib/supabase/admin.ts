import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Client Supabase avec la clé SERVICE ROLE.
 *
 * ⚠️ NE JAMAIS importer ce fichier depuis un Client Component ni l'exposer
 * au bundle navigateur. Le paquet `server-only` fait échouer le build si
 * ce fichier est importé côté client, par sécurité.
 *
 * Usage : uniquement pour des opérations serveur qui doivent légitimement
 * contourner RLS (ex : création d'un utilisateur par le propriétaire via
 * une Server Action déjà protégée par une vérification de permission).
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
