"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { openCashSession } from "@/services/pos.actions";

export function OpenCashSessionForm({ storeId, registerId }: { storeId: string; registerId: string }) {
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await openCashSession(storeId, registerId, Number(amount));
        toast.success("Caisse ouverte");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur lors de l'ouverture de la caisse");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor="opening_amount" className="text-sm font-medium">
        Fond de caisse initial (FCFA)
      </label>
      <input
        id="opening_amount"
        type="number"
        min={0}
        required
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="50000"
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-katiola-blue-600 px-4 py-2.5 font-medium text-white hover:bg-katiola-blue-700 disabled:opacity-60"
      >
        {isPending ? "Ouverture..." : "Ouvrir la caisse"}
      </button>
    </form>
  );
}
