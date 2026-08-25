import { createClient } from "@/lib/supabase/server";
import type { PermissionKey } from "@/types/app";

/**
 * Vérifie côté serveur qu'un utilisateur a une permission donnée sur une boutique.
 * Utilise la fonction SQL public.has_permission (même logique que RLS),
 * donc AUCUNE divergence possible entre ce que l'UI autorise et ce que
 * la base de données autorise réellement.
 *
 * À appeler en tout début de Server Action avant toute écriture sensible.
 * Ceci s'ajoute à RLS — ce n'est pas un remplacement — il permet simplement
 * de retourner une erreur métier propre plutôt qu'un rejet RLS générique.
 */
export async function assertPermission(storeId: string, permission: PermissionKey) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("has_permission", {
    p_store_id: storeId,
    p_permission_key: permission,
  });

  if (error) {
    throw new Error(`Erreur de vérification des permissions : ${error.message}`);
  }
  if (!data) {
    throw new Error("Action non autorisée : permission manquante pour cette boutique.");
  }
}

export async function getCurrentUserOrThrow() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Utilisateur non authentifié.");
  }
  return user;
}
