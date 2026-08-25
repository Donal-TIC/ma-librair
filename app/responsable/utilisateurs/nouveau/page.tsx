import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateUserForm } from "@/components/stores/CreateUserForm";

export default async function NewUserPage() {
  const supabase = await createClient();
  const { data: stores } = await supabase
    .from("stores")
    .select("id, name")
    .eq("status", "active")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/responsable/utilisateurs" className="text-sm text-muted-foreground hover:underline">
          ← Utilisateurs
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold">Ajouter un utilisateur</h1>
      </div>
      <CreateUserForm stores={stores ?? []} />
    </div>
  );
}
