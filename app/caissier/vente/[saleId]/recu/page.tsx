import { createClient } from "@/lib/supabase/server";
import { PrintReceiptButton } from "@/components/pos/PrintReceiptButton";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

export default async function ReceiptPage({ params }: { params: Promise<{ saleId: string }> }) {
  const { saleId } = await params;
  const supabase = await createClient();

  const { data: sale } = await supabase
    .from("sales")
    .select("sale_number, total, subtotal, discount, created_at, stores(name, address, phone)")
    .eq("id", saleId)
    .single();

  const { data: items } = await supabase
    .from("sale_items")
    .select("quantity, unit_price, line_total, products(name)")
    .eq("sale_id", saleId);

  if (!sale) return <p className="p-6">Vente introuvable.</p>;
  const store = sale.stores as unknown as { name: string; address: string | null; phone: string | null } | null;

  return (
    <div className="mx-auto max-w-sm space-y-4 p-4">
      <div id="receipt-print" className="rounded-xl border border-dashed border-border bg-white p-4 font-mono text-xs text-black">
        <p className="text-center font-bold">{store?.name?.toUpperCase() ?? "LA LIBRAIRIE DE KATIOLA"}</p>
        {store?.address && <p className="text-center">{store.address}</p>}
        {store?.phone && <p className="text-center">{store.phone}</p>}
        <p className="mt-2">N° vente : {sale.sale_number}</p>
        <p>Date : {new Date(sale.created_at).toLocaleString("fr-FR")}</p>
        <hr className="my-2 border-dashed" />
        {items?.map((it, i) => (
          <div key={i} className="flex justify-between">
            <span className="truncate pr-2">
              {(it.products as unknown as { name: string } | null)?.name} x{it.quantity}
            </span>
            <span>{fmt(it.line_total)}</span>
          </div>
        ))}
        <hr className="my-2 border-dashed" />
        <div className="flex justify-between">
          <span>Sous-total</span><span>{fmt(sale.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Remise</span><span>{fmt(sale.discount)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total</span><span>{fmt(sale.total)}</span>
        </div>
        <p className="mt-3 text-center">Merci pour votre visite</p>
      </div>

      <PrintReceiptButton />
    </div>
  );
}
