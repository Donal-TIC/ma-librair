import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserStatusToggle } from "@/components/stores/UserStatusToggle";

const ROLE_LABELS: Record<string, string> = {
  manager: "Responsable / Manager",
  cashier: "Caissier",
  accountant: "Comptable",
  stock_manager: "Gestionnaire de stock",
  supervisor: "Superviseur",
};

export default async function UsersPage() {
  const supabase = await createClient();

  const { data: storeUsers } = await supabase
    .from("store_users")
    .select("id, role, store_id, stores(name), profiles(id, first_name, last_name, email, phone, status, last_login_at)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Utilisateurs</h1>
          <p className="text-muted-foreground">Comptes du personnel et leurs accès par boutique.</p>
        </div>
        <Link
          href="/responsable/utilisateurs/nouveau"
          className="rounded-lg bg-katiola-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-katiola-green-700"
        >
          + Ajouter un utilisateur
        </Link>
      </div>

      {!storeUsers || storeUsers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">Aucun utilisateur n&rsquo;a encore été créé.</p>
          <Link href="/responsable/utilisateurs/nouveau" className="mt-3 inline-block text-sm font-medium text-katiola-green-700 hover:underline">
            Ajouter un utilisateur
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Boutique</th>
                <th className="px-4 py-3 font-medium">Rôle</th>
                <th className="px-4 py-3 font-medium">Dernière connexion</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {storeUsers.map((su) => {
                const profile = su.profiles as unknown as {
                  id: string; first_name: string; last_name: string; email: string;
                  status: "active" | "disabled"; last_login_at: string | null;
                } | null;
                const store = su.stores as unknown as { name: string } | null;
                if (!profile) return null;

                return (
                  <tr key={su.id} className="bg-card">
                    <td className="px-4 py-3">
                      <p className="font-medium">{profile.first_name} {profile.last_name}</p>
                      <p className="text-xs text-muted-foreground">{profile.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{store?.name ?? "—"}</td>
                    <td className="px-4 py-3">{ROLE_LABELS[su.role] ?? su.role}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {profile.last_login_at ? new Date(profile.last_login_at).toLocaleString("fr-FR") : "Jamais connecté"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          profile.status === "active"
                            ? "rounded-full bg-katiola-green-100 px-2 py-0.5 text-xs font-medium text-katiola-green-700"
                            : "rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"
                        }
                      >
                        {profile.status === "active" ? "Actif" : "Désactivé"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <UserStatusToggle storeId={su.store_id} userId={profile.id} status={profile.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
