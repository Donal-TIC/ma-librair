import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { OpenCashSessionForm } from "@/components/pos/OpenCashSessionForm";

export default async function CaissierDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user!.id)
    .single();

  const { data: storeUser } = await supabase
    .from("store_users")
    .select("store_id, stores(name)")
    .eq("user_id", user!.id)
    .limit(1)
    .maybeSingle();

  const storeId = storeUser?.store_id;

  const { data: registers } = storeId
    ? await supabase.from("cash_registers").select("id, name").eq("store_id", storeId).eq("is_active", true)
    : { data: [] as { id: string; name: string }[] };

  const { data: openSession } = storeId
    ? await supabase
        .from("cash_sessions")
        .select("id, opening_amount, opened_at")
        .eq("store_id", storeId)
        .eq("opened_by", user!.id)
        .eq("status", "open")
        .maybeSingle()
    : { data: null };

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { data: todaySales } = storeId
    ? await supabase
        .from("sales")
        .select("total")
        .eq("cashier_id", user!.id)
        .gte("created_at", startOfDay.toISOString())
    : { data: [] as { total: number }[] };

  const totalToday = (todaySales ?? []).reduce((s, sale) => s + Number(sale.total), 0);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Bonjour {profile?.first_name} 👋</h1>
        <p className="text-muted-foreground">
          {(storeUser?.stores as unknown as { name: string } | null)?.name ?? "Aucune boutique assignée"}
        </p>
      </div>

      {!openSession ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-3 font-medium">Caisse fermée</p>
          {registers && registers.length > 0 && storeId ? (
            <OpenCashSessionForm storeId={storeId} registerId={registers[0].id} />
          ) : (
            <p className="text-sm text-muted-foreground">Aucune caisse configurée pour votre boutique.</p>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-katiola-green-200 bg-katiola-green-50 p-5 dark:bg-katiola-green-900/30">
            <p className="text-sm text-katiola-green-800 dark:text-katiola-green-200">
              Caisse ouverte depuis {new Date(openSession.opened_at).toLocaleTimeString("fr-FR")}
            </p>
            <p className="text-sm text-muted-foreground">
              Fond initial : {new Intl.NumberFormat("fr-FR").format(openSession.opening_amount)} FCFA
            </p>
          </div>

          <Link
            href="/caissier/vente"
            className="block rounded-xl bg-katiola-blue-600 px-6 py-4 text-center font-medium text-white shadow-sm hover:bg-katiola-blue-700"
          >
            🧾 Nouvelle vente
          </Link>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Ventes du jour</p>
              <p className="font-display text-xl font-bold">{todaySales?.length ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Montant encaissé</p>
              <p className="font-display text-xl font-bold">
                {new Intl.NumberFormat("fr-FR").format(totalToday)} FCFA
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
