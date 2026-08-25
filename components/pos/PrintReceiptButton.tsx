"use client";

import Link from "next/link";

export function PrintReceiptButton() {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => window.print()}
        className="flex-1 rounded-lg bg-katiola-green-600 py-2.5 font-medium text-white hover:bg-katiola-green-700"
      >
        Imprimer le reçu
      </button>
      <Link
        href="/caissier/vente"
        className="flex-1 rounded-lg border border-input py-2.5 text-center font-medium hover:bg-muted"
      >
        Nouvelle vente
      </Link>
    </div>
  );
}
