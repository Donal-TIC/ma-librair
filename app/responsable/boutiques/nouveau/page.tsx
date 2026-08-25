import Link from "next/link";
import { StoreForm } from "@/components/stores/StoreForm";

export default function NewStorePage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/responsable/boutiques" className="text-sm text-muted-foreground hover:underline">
          ← Boutiques
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold">Créer une boutique</h1>
      </div>
      <StoreForm />
    </div>
  );
}
