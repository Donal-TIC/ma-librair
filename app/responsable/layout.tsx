import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const NAV_SECTIONS = [
  { label: "Tableau de bord", href: "/responsable" },
  { label: "Boutiques", href: "/responsable/boutiques" },
  { label: "Utilisateurs", href: "/responsable/utilisateurs" },
  { label: "Produits", href: "/responsable/produits" },
  { label: "Stock", href: "/responsable/stock" },
  { label: "Achats", href: "/responsable/achats" },
  { label: "Ventes", href: "/responsable/ventes" },
  { label: "Retours", href: "/responsable/retours" },
  { label: "Caisses", href: "/responsable/caisses" },
  { label: "Dépenses", href: "/responsable/depenses" },
  { label: "Clients", href: "/responsable/clients" },
  { label: "Rapports", href: "/responsable/rapports" },
  { label: "Notifications", href: "/responsable/notifications" },
  { label: "Journal d'activité", href: "/responsable/audit" },
  { label: "Paramètres", href: "/responsable/parametres" },
];

export default async function ResponsableLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Filet de sécurité côté serveur en plus du middleware. RLS reste la vraie barrière.
  if (!user) redirect("/login/responsable");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, status")
    .eq("id", user.id)
    .single();

  if (profile?.status === "disabled") {
    await supabase.auth.signOut();
    redirect("/login/responsable");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card p-4 lg:flex">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-katiola-green-600 font-display text-sm font-bold text-white">
            LK
          </div>
          <span className="font-display text-sm font-semibold leading-tight">
            La librairie<br />de Katiola
          </span>
        </div>

        <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto">
          {NAV_SECTIONS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-katiola-green-50 hover:text-katiola-green-800 dark:hover:bg-katiola-green-900/40"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border pt-3 text-xs text-muted-foreground">
          Connecté : {profile?.first_name} {profile?.last_name}
        </div>
      </aside>

      <div className="flex-1">
        {/* Barre mobile simplifiée — le menu complet mérite un composant dédié (Sheet) en Phase 19 */}
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
          <span className="font-display text-sm font-semibold">La librairie de Katiola</span>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
