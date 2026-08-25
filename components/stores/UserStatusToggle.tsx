"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { disableStaffUser, reactivateStaffUser } from "@/services/users.actions";

export function UserStatusToggle({
  storeId,
  userId,
  status,
}: {
  storeId: string;
  userId: string;
  status: "active" | "disabled";
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    const confirmed = window.confirm(
      status === "active"
        ? "Désactiver cet utilisateur ? Il ne pourra plus se connecter."
        : "Réactiver cet utilisateur ?"
    );
    if (!confirmed) return;

    startTransition(async () => {
      try {
        if (status === "active") {
          await disableStaffUser(storeId, userId);
          toast.success("Utilisateur désactivé");
        } else {
          await reactivateStaffUser(storeId, userId);
          toast.success("Utilisateur réactivé");
        }
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
