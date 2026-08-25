import { createClient } from "@/lib/supabase/server";

function formatFCFA(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount)) + " FCFA";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [{ data: todaySales }, { data: lowStock }, { data: openSessions }] = await Promise.all([
    supabase.from("sales").select("total").gte("created_at", startOfDay.toISOString()).eq("status", "completed"),
    supabase.from("inventory").select("id").lte("quantity", 5),
    supabase.from("cash_sessions").select("id, opening_amount").eq("status", "open"),
  ]);

  const revenueToday = (todaySales ?? []).reduce((sum, s) => sum + Number(s.total), 0);
  const salesCountToday = todaySales?.length ?? 0;

  const cards = [
    { label: "Chiffre d'affaires (aujourd'hui)", value: formatFCFA(revenueToday) },
    { label: "Ventes (aujourd'hui)", value: String(salesCountToday) },
    { label: "Produits en stock faible", value: String(lowStock?.length ?? 0) },
    { label: "Caisses ouvertes", value: String(openSessions?.length ?? 0) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Bonjour 👋</h1>
        <p className="text-muted-foreground">Voici l&rsquo;activité de votre librairie aujourd&rsquo;hui.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-katiola-green-700 dark:text-katiola-green-300">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Les graphiques d&rsquo;évolution des ventes, la comparaison des boutiques et le top produits
          (Phases 12, 63, 64) se branchent sur les mêmes tables <code>sales</code> / <code>sale_items</code> —
          composant <code>components/dashboard/RevenueChart.tsx</code> à connecter avec recharts.
        </p>
      </div>
    </div>
  );
}
