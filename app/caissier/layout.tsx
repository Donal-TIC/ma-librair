import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CaissierLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login/caissier");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", user.id)
    .single();

  if (profile?.status === "disabled") {
    await supabase.auth.signOut();
    redirect("/login/caissier");
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-katiola-blue-600 font-display text-xs font-bold text-white">
            LK
          </div>
          <span className="font-display text-sm font-semibold">La librairie de Katiola</span>
        </div>
        <nav className="flex gap-4 text-sm">
          <Link href="/caissier" className="text-muted-foreground hover:text-foreground">Accueil</Link>
          <Link href="/caissier/vente" className="font-medium text-katiola-blue-600">Caisse</Link>
        </nav>
      </header>
      <main className="p-4 sm:p-6">{children}</main>
    </div>
  );
}
