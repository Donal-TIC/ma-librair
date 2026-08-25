"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertPermission, getCurrentUserOrThrow } from "@/lib/permissions";
import { createUserSchema, type CreateUserFormValues } from "@/lib/validations/store-user";

/**
 * Crée un compte utilisateur (caissier, manager, etc.) et l'associe à une boutique.
 *
 * Nécessite la permission `users.create` sur la boutique cible — vérifiée via
 * la même fonction SQL que RLS, donc pas de divergence possible.
 *
 * Utilise la clé service role UNIQUEMENT ici, côté serveur, pour créer le
 * compte Supabase Auth (auth.admin.createUser n'est pas exposé au client).
 * Cette Server Action est le seul endroit du projet qui a besoin de ce
 * privilège élevé, et il est protégé par assertPermission() en première ligne.
 */
export async function createStaffUser(input: CreateUserFormValues) {
  await assertPermission(input.store_id, "users.create");
  const parsed = createUserSchema.parse(input);

  const admin = createAdminClient();

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: parsed.email,
    password: parsed.password,
    email_confirm: true,
    user_metadata: { first_name: parsed.first_name, last_name: parsed.last_name },
  });

  if (authError || !authUser.user) {
    if (authError?.message.includes("already been registered")) {
      throw new Error("Un compte existe déjà avec cet email.");
    }
    throw new Error(`Impossible de créer le compte : ${authError?.message ?? "erreur inconnue"}`);
  }

  // Le trigger handle_new_auth_user a créé la ligne profiles ; on complète le téléphone.
  if (parsed.phone) {
    await admin.from("profiles").update({ phone: parsed.phone }).eq("id", authUser.user.id);
  }

  const { error: linkError } = await admin.from("store_users").insert({
    store_id: parsed.store_id,
    user_id: authUser.user.id,
    role: parsed.role,
    is_primary: true,
  });

  if (linkError) {
    // Nettoyage : on ne laisse pas un compte orphelin sans boutique/rôle.
    await admin.auth.admin.deleteUser(authUser.user.id);
    throw new Error(`Impossible d'associer l'utilisateur à la boutique : ${linkError.message}`);
  }

  revalidatePath("/responsable/utilisateurs");
  return { userId: authUser.user.id };
}

export async function disableStaffUser(storeId: string, userId: string) {
  await assertPermission(storeId, "users.disable");
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").update({ status: "disabled" }).eq("id", userId);
  if (error) throw new Error(`Impossible de désactiver l'utilisateur : ${error.message}`);
  revalidatePath("/responsable/utilisateurs");
}

export async function reactivateStaffUser(storeId: string, userId: string) {
  await assertPermission(storeId, "users.update");
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").update({ status: "active" }).eq("id", userId);
  if (error) throw new Error(`Impossible de réactiver l'utilisateur : ${error.message}`);
  revalidatePath("/responsable/utilisateurs");
}

export async function updateStaffRole(storeUserId: string, storeId: string, role: CreateUserFormValues["role"]) {
  await getCurrentUserOrThrow();
  await assertPermission(storeId, "users.update");
  const supabase = await createClient();

  const { error } = await supabase.from("store_users").update({ role }).eq("id", storeUserId);
  if (error) throw new Error(`Impossible de modifier le rôle : ${error.message}`);
  revalidatePath("/responsable/utilisateurs");
}
