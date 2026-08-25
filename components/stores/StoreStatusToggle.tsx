"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setStoreStatus } from "@/services/stores.actions";

export function StoreStatusToggle({ storeId, status }: { storeId: string; status: "active" | "inactive" }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    const next = status === "active" ? "inactive" : "active";
    const confirmed = window.confirm(
      next === "inactive"
        ? "Désactiver cette boutique ? Elle restera consultable mais son personnel ne pourra plus l'utiliser."
        : "Réactiver cette boutique ?"
    );
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await setStoreStatus(storeId, next);
        toast.success(next === "active" ? "Boutique réactivée" : "Boutique désactivée");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur");
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={
        status === "active"
          ? "rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
          : "rounded-lg border border-katiola-green-300 px-3 py-1.5 text-xs font-medium text-katiola-green-700 hover:bg-katiola-green-50"
      }
    >
      {status === "active" ? "Désactiver" : "Réactiver"}
    </button>
  );
}
