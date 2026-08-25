import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { POSTerminal } from "@/components/pos/POSTerminal";

export default async function VentePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: storeUser } = await supabase
    .from("store_users")
    .select("store_id")
    .eq("user_id", user!.id)
    .limit(1)
    .maybeSingle();

  if (!storeUser) redirect("/caissier");

  const { data: openSession } = await supabase
    .from("cash_sessions")
    .select("id")
    .eq("store_id", storeUser.store_id)
    .eq("opened_by", user!.id)
    .eq("status", "open")
    .maybeSingle();

  if (!openSession) redirect("/caissier"); // une vente ne peut pas être enregistrée caisse fermée

  return <POSTerminal storeId={storeUser.store_id} cashSessionId={openSession.id} />;
}
