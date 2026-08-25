import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StoreForm } from "@/components/stores/StoreForm";

export default async function EditStorePage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("name, code, address, phone, email, opening_hours")
    .eq("id", storeId)
    .single();

  if (!store) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/responsable/boutiques" className="text-sm text-muted-foreground hover:underline">
          ← Boutiques
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold">Modifier {store.name}</h1>
      </div>
      <StoreForm storeId={storeId} defaultValues={store} />
    </div>
  );
}
