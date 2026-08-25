"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertPermission, getCurrentUserOrThrow } from "@/lib/permissions";
import { productSchema, type ProductFormValues } from "@/lib/validations/product";

/**
 * Crée un produit. Nécessite la permission `products.create` sur la boutique
 * de contexte (le catalogue est partagé, mais la création reste gouvernée
 * par les droits de l'utilisateur dans au moins une de ses boutiques).
 */
export async function createProduct(storeId: string, input: ProductFormValues) {
  await assertPermission(storeId, "products.create");
  const user = await getCurrentUserOrThrow();
  const parsed = productSchema.parse(input);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({ ...parsed, created_by: user.id })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Un produit avec ce code-barres existe déjà.");
    }
    throw new Error(`Impossible de créer le produit : ${error.message}`);
  }

  revalidatePath("/responsable/produits");
  return data;
}

export async function updateProduct(storeId: string, productId: string, input: ProductFormValues) {
  await assertPermission(storeId, "products.update");
  const parsed = productSchema.parse(input);

  const supabase = await createClient();
  const { error } = await supabase.from("products").update(parsed).eq("id", productId);

  if (error) throw new Error(`Impossible de modifier le produit : ${error.message}`);
  revalidatePath("/responsable/produits");
}

/** Suppression logique uniquement — jamais de suppression physique d'un produit. */
export async function archiveProduct(storeId: string, productId: string) {
  await assertPermission(storeId, "products.delete");

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_active: false, deleted_at: new Date().toISOString() })
    .eq("id", productId);

  if (error) throw new Error(`Impossible d'archiver le produit : ${error.message}`);
  revalidatePath("/responsable/produits");
}

export async function searchProducts(query: string, limit = 20) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, barcode, isbn, sale_price, promo_price, image_url")
    .is("deleted_at", null)
    .eq("is_active", true)
    .or(`name.ilike.%${query}%,barcode.eq.${query},isbn.eq.${query}`)
    .limit(limit);

  if (error) throw new Error(`Recherche impossible : ${error.message}`);
  return data;
}
