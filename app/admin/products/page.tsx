import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { brl, num } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminProducts({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const params = await searchParams;
  const catFilter = typeof params.cat === "string" ? params.cat : null;

  const supabase = await createClient();
  let query = supabase.from("products").select("*").order("cat").order("sort_order");
  if (catFilter) query = query.eq("cat", catFilter);
  const { data: products } = await query;

  const cats = ["queijos", "vinhos", "charutos", "casa", "kit"] as const;

  return (
    <>
      <div className="admin-hd">
        <div className="admin-hd-l">
          <span className="admin-hd-kicker">Sortimento</span>
          <h1>Produtos</h1>
        </div>
        <Link href="/admin/products/new" className="admin-btn admin-btn-primary">
          Novo produto
        </Link>
      </div>

      <div className="admin-tabs">
        <Link href="/admin/products" data-active={!catFilter}>
          Todos
        </Link>
        {cats.map((c) => (
          <Link
            key={c}
            href={`/admin/products?cat=${c}`}
            data-active={catFilter === c}
          >
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </Link>
        ))}
      </div>

      {!products || products.length === 0 ? (
        <div className="admin-empty">
          Nenhum produto encontrado. Rode as migrations e depois o seed no Supabase, ou crie
          manualmente.
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Origem</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12 }}>
                    {p.id}
                  </td>
                  <td className="italic">{p.name}</td>
                  <td>{p.cat}</td>
                  <td className="italic" style={{ fontSize: 12 }}>{p.origin}</td>
                  <td className="tnum">{brl(Number(p.price))}</td>
                  <td className="tnum">{num(p.stock)}</td>
                  <td>
                    <span
                      className={`admin-badge ${
                        p.active ? "admin-badge-active" : "admin-badge-canceled"
                      }`}
                    >
                      {p.active ? "ativo" : "inativo"}
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/products/${p.id}`}>editar</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
