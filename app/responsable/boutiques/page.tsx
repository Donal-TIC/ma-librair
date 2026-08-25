import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StoreStatusToggle } from "@/components/stores/StoreStatusToggle";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

export default async function StoresPage() {
  const supabase = await createClient();

  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, code, address, phone, status")
    .order("created_at", { ascending: true });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const storesWithStats = await Promise.all(
    (stores ?? []).map(async (store) => {
      const [{ data: sales }, { data: users }, { count: productCount }] = await Promise.all([
        supabase.from("sales").select("total").eq("store_id", store.id).gte("created_at", startOfMonth.toISOString()),
        supabase.from("store_users").select("id").eq("store_id", store.id),
        supabase.from("inventory").select("id", { count: "exact", head: true }).eq("store_id", store.id),
      ]);
      const revenue = (sales ?? []).reduce((s, x) => s + Number(x.total), 0);
      return { ...store, revenue, userCount: users?.length ?? 0, productCount: productCount ?? 0 };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Boutiques</h1>
          <p className="text-muted-foreground">Gérez vos différents points de vente.</p>
        </div>
        <Link
          href="/responsable/boutiques/nouveau"
          className="rounded-lg bg-katiola-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-katiola-green-700"
        >
          + Créer une boutique
        </Link>
      </div>

      {storesWithStats.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">Aucune boutique n&rsquo;a encore été créée.</p>
          <Link href="/responsable/boutiques/nouveau" className="mt-3 inline-block text-sm font-medium text-katiola-green-700 hover:underline">
            Créer votre première boutique
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {storesWithStats.map((store) => (
            <div key={store.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display font-semibold">{store.name}</p>
                  <p className="text-xs text-muted-foreground">{store.code}</p>
                </div>
                <span
                  className={
                    store.status === "active"
                      ? "rounded-full bg-katiola-green-100 px-2 py-0.5 text-xs font-medium text-katiola-green-700"
                      : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                  }
                >
                  {store.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>

              {store.address && <p className="mt-2 text-sm text-muted-foreground">{store.address}</p>}

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="font-display text-sm font-bold">{fmt(store.revenue)}</p>
                  <p className="text-muted-foreground">CA du mois</p>
                </div>
                <div>
                  <p className="font-display text-sm font-bold">{store.userCount}</p>
                  <p className="text-muted-foreground">Utilisateurs</p>
                </div>
                <div>
                  <p className="font-display text-sm font-bold">{store.productCount}</p>
                  <p className="text-muted-foreground">Réf. en stock</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Link
                  href={`/responsable/boutiques/${store.id}`}
                  className="flex-1 rounded-lg border border-input py-1.5 text-center text-xs font-medium hover:bg-muted"
                >
                  Modifier
                </Link>
                <StoreStatusToggle storeId={store.id} status={store.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
