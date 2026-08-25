"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrThrow } from "@/lib/permissions";
import { storeSchema, type StoreFormValues } from "@/lib/validations/store-user";

async function assertOwner() {
  const supabase = await createClient();
  const user = await getCurrentUserOrThrow();
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_owner")
    .eq("id", user.id)
    .single();

  if (!profile?.is_owner) {
    throw new Error("Seul le propriétaire peut gérer les boutiques.");
  }
  return user;
}

export async function createStore(input: StoreFormValues) {
  const user = await assertOwner();
  const parsed = storeSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stores")
    .insert({ ...parsed, email: parsed.email || null, created_by: user.id })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("Ce code de boutique existe déjà.");
    throw new Error(`Impossible de créer la boutique : ${error.message}`);
  }

  // Une boutique nouvellement créée reçoit automatiquement une caisse par défaut,
  // pour que le workflow d'ouverture de caisse fonctionne immédiatement.
  await supabase.from("cash_registers").insert({ store_id: data.id, name: "Caisse principale" });

  revalidatePath("/responsable/boutiques");
  return data;
}

export async function updateStore(storeId: string, input: StoreFormValues) {
  await assertOwner();
  const parsed = storeSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase
    .from("stores")
    .update({ ...parsed, email: parsed.email || null })
    .eq("id", storeId);

  if (error) throw new Error(`Impossible de modifier la boutique : ${error.message}`);
  revalidatePath("/responsable/boutiques");
}

export async function setStoreStatus(storeId: string, status: "active" | "inactive") {
  await assertOwner();
  const supabase = await createClient();

  const { error } = await supabase.from("stores").update({ status }).eq("id", storeId);
  if (error) throw new Error(`Impossible de changer le statut : ${error.message}`);
  revalidatePath("/responsable/boutiques");
}
