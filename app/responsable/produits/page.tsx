import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const currentPage = Number(page ?? "1");
  const pageSize = 20;

  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("id, name, isbn, barcode, sale_price, category_id", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

  if (q) query = query.ilike("name", `%${q}%`);

  const { data: products, count } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Produits</h1>
        <Link
          href="/responsable/produits/nouveau"
          className="rounded-lg bg-katiola-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-katiola-green-700"
        >
          + Ajouter un produit
        </Link>
      </div>

      <form className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Rechercher par nom, ISBN, code-barres..."
          className="w-full max-w-sm rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </form>

      {!products || products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">Aucun produit n&rsquo;a encore été ajouté.</p>
          <Link
            href="/responsable/produits/nouveau"
            className="mt-3 inline-block text-sm font-medium text-katiola-green-700 hover:underline"
          >
            Ajouter un produit
          </Link>
        </div>
      ) : (
        <>
          {/* Tableau desktop */}
          <div className="hidden overflow-hidden rounded-xl border border-border sm:block">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium">ISBN / Code-barres</th>
                  <th className="px-4 py-3 font-medium text-right">Prix de vente</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => (
                  <tr key={p.id} className="bg-card">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.barcode ?? p.isbn ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {new Intl.NumberFormat("fr-FR").format(p.sale_price)} FCFA
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/responsable/produits/${p.id}`} className="text-katiola-blue-600 hover:underline">
                        Modifier
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cartes mobile */}
          <div className="space-y-3 sm:hidden">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/responsable/produits/${p.id}`}
                className="block rounded-xl border border-border bg-card p-4"
              >
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-muted-foreground">{p.barcode ?? p.isbn ?? "—"}</p>
                <p className="mt-1 font-semibold text-katiola-green-700">
                  {new Intl.NumberFormat("fr-FR").format(p.sale_price)} FCFA
                </p>
              </Link>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            {count ?? 0} produit(s) au total — page {currentPage}
          </p>
        </>
      )}
    </div>
  );
}
