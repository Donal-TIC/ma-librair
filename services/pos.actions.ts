"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertPermission, getCurrentUserOrThrow } from "@/lib/permissions";

export interface CartLine {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount?: number;
}

export interface PaymentLine {
  method: "cash" | "card" | "mobile_money" | "bank_transfer" | "other";
  amount: number;
  amount_received?: number;
}

/** Ouvre une session de caisse. Bloqué si une session est déjà ouverte sur cette caisse. */
export async function openCashSession(storeId: string, cashRegisterId: string, openingAmount: number) {
  await assertPermission(storeId, "cash.open");
  const user = await getCurrentUserOrThrow();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("cash_sessions")
    .select("id")
    .eq("cash_register_id", cashRegisterId)
    .eq("status", "open")
    .maybeSingle();

  if (existing) {
    throw new Error("Une session de caisse est déjà ouverte sur cette caisse.");
  }

  const { data, error } = await supabase
    .from("cash_sessions")
    .insert({
      cash_register_id: cashRegisterId,
      store_id: storeId,
      opened_by: user.id,
      opening_amount: openingAmount,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Ouverture de caisse impossible : ${error.message}`);
  revalidatePath("/caissier");
  return data;
}

/** Clôture une session : calcule le théorique, enregistre le compté et l'écart. */
export async function closeCashSession(
  storeId: string,
  sessionId: string,
  countedAmount: number,
  varianceNote?: string
) {
  await assertPermission(storeId, "cash.close");
  const user = await getCurrentUserOrThrow();
  const supabase = await createClient();

  const { data: session, error: sessionError } = await supabase
    .from("cash_sessions")
    .select("opening_amount")
    .eq("id", sessionId)
    .single();
  if (sessionError || !session) throw new Error("Session de caisse introuvable.");

  const { data: cashPayments } = await supabase
    .from("payments")
    .select("amount, sales!inner(cash_session_id)")
    .eq("method", "cash")
    .eq("sales.cash_session_id", sessionId);

  const { data: movements } = await supabase
    .from("cash_movements")
    .select("type, amount")
    .eq("cash_session_id", sessionId);

  const cashSalesTotal = (cashPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const movementsIn = (movements ?? []).filter((m) => m.type === "in").reduce((s, m) => s + Number(m.amount), 0);
  const movementsOut = (movements ?? []).filter((m) => m.type === "out").reduce((s, m) => s + Number(m.amount), 0);

  const expected = Number(session.opening_amount) + cashSalesTotal + movementsIn - movementsOut;
  const variance = countedAmount - expected;

  const { error } = await supabase
    .from("cash_sessions")
    .update({
      status: "closed",
      closed_by: user.id,
      closed_at: new Date().toISOString(),
      expected_closing_amount: expected,
      counted_closing_amount: countedAmount,
      variance,
      variance_note: varianceNote ?? null,
    })
    .eq("id", sessionId);

  if (error) throw new Error(`Clôture impossible : ${error.message}`);
  revalidatePath("/caissier");
  return { expected, variance };
}

/**
 * Crée une vente complète de façon atomique via la fonction Postgres
 * `create_sale` (vente + lignes + paiements + déduction stock en une transaction).
 */
export async function createSale(params: {
  storeId: string;
  cashSessionId: string;
  customerId?: string | null;
  items: CartLine[];
  payments: PaymentLine[];
  discount?: number;
}) {
  await assertPermission(params.storeId, "sales.create");
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_sale", {
    p_store_id: params.storeId,
    p_cash_session_id: params.cashSessionId,
    p_customer_id: params.customerId ?? null,
    p_items: params.items,
    p_payments: params.payments,
    p_discount: params.discount ?? 0,
    p_allow_negative_stock: false,
  });

  if (error) throw new Error(`Vente impossible : ${error.message}`);
  revalidatePath("/caissier");
  return data as string; // sale id
}
