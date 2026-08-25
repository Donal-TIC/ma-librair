"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { searchProducts } from "@/services/products.actions";
import { createSale, type CartLine } from "@/services/pos.actions";

interface ProductResult {
  id: string;
  name: string;
  barcode: string | null;
  isbn: string | null;
  sale_price: number;
  promo_price: number | null;
  image_url: string | null;
}

interface CartItem extends CartLine {
  name: string;
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

export function POSTerminal({ storeId, cashSessionId }: { storeId: string; cashSessionId: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductResult[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [searching, setSearching] = useState(false);
  const router = useRouter();

  async function handleSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await searchProducts(value.trim());
      setResults(data as ProductResult[]);
    } catch {
      // recherche silencieuse : pas de panique visuelle pour une simple frappe
    } finally {
      setSearching(false);
    }
  }

  function addToCart(product: ProductResult) {
    const price = product.promo_price ?? product.sale_price;
    setCart((prev) => {
      const existing = prev.find((l) => l.product_id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product_id === product.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [...prev, { product_id: product.id, name: product.name, quantity: 1, unit_price: price, discount: 0 }];
    });
    setQuery("");
    setResults([]);
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((l) => l.product_id !== productId));
      return;
    }
    setCart((prev) => prev.map((l) => (l.product_id === productId ? { ...l, quantity } : l)));
  }

  const total = cart.reduce((sum, l) => sum + l.quantity * l.unit_price - (l.discount ?? 0), 0);

  function handlePay() {
    if (cart.length === 0) return;
    startTransition(async () => {
      try {
        const saleId = await createSale({
          storeId,
          cashSessionId,
          items: cart.map(({ product_id, quantity, unit_price, discount }) => ({
            product_id, quantity, unit_price, discount,
          })),
          payments: [{ method: "cash", amount: total, amount_received: total }],
        });
        toast.success("Vente enregistrée");
        setCart([]);
        router.push(`/caissier/vente/${saleId}/recu`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur lors de l'encaissement");
      }
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="relative">
          <input
            autoFocus
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Rechercher ou scanner un produit (nom, code-barres, ISBN)..."
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring"
          />
          {searching && <span className="absolute right-4 top-3.5 text-xs text-muted-foreground">…</span>}
        </div>

        {results.length > 0 && (
          <div className="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted"
              >
                <span>{p.name}</span>
                <span className="font-medium text-katiola-green-700">{fmt(p.promo_price ?? p.sale_price)}</span>
              </button>
            ))}
          </div>
        )}

        {query.length >= 2 && !searching && results.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Produit introuvable. <span className="text-katiola-blue-600">Créer le produit</span> depuis l&rsquo;espace Responsable.
          </p>
        )}
      </div>

      <div className="flex flex-col rounded-xl border border-border bg-card">
        <div className="flex-1 divide-y divide-border overflow-y-auto">
          {cart.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Panier vide</p>
          ) : (
            cart.map((line) => (
              <div key={line.product_id} className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{line.name}</p>
                  <p className="text-xs text-muted-foreground">{fmt(line.unit_price)} / unité</p>
                </div>
                <input
                  type="number"
                  min={0}
                  value={line.quantity}
                  onChange={(e) => updateQuantity(line.product_id, Number(e.target.value))}
                  className="w-14 rounded-md border border-input bg-background px-2 py-1 text-center text-sm"
                />
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border p-4">
          <div className="mb-3 flex items-center justify-between font-display text-lg font-bold">
            <span>Total</span>
            <span>{fmt(total)}</span>
          </div>
          <button
            onClick={handlePay}
            disabled={cart.length === 0 || isPending}
            className="w-full rounded-xl bg-katiola-green-600 py-3 font-medium text-white hover:bg-katiola-green-700 disabled:opacity-50"
          >
            {isPending ? "Encaissement..." : "PAYER"}
          </button>
        </div>
      </div>
    </div>
  );
}
