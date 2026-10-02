import { createClient } from "@/lib/supabase/server";
import { brl, num } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: usersCount },
    { count: productsCount },
    { count: activeSubsCount },
    { count: pendingOrdersCount },
    { data: recentOrders },
    { data: revenue },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("active", true),
    supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("orders")
      .select("id, user_id, total, status, delivery_method, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("orders").select("total").in("status", ["paid", "shipped", "delivered"]),
  ]);

  const totalRevenue = (revenue ?? []).reduce((a, r) => a + Number(r.total), 0);

  return (
    <>
      <div className="admin-hd">
        <div className="admin-hd-l">
          <span className="admin-hd-kicker">Visão geral</span>
          <h1>Dashboard</h1>
        </div>
      </div>

      <div className="admin-metrics">
        <div className="admin-metric">
          <span className="admin-metric-lbl">Usuários</span>
          <span className="admin-metric-val">{num(usersCount ?? 0)}</span>
          <span className="admin-metric-sub">cadastros totais</span>
        </div>
        <div className="admin-metric">
          <span className="admin-metric-lbl">Produtos ativos</span>
          <span className="admin-metric-val">{num(productsCount ?? 0)}</span>
          <span className="admin-metric-sub">no sortimento</span>
        </div>
        <div className="admin-metric">
          <span className="admin-metric-lbl">Assinantes ativos</span>
          <span className="admin-metric-val">{num(activeSubsCount ?? 0)}</span>
          <span className="admin-metric-sub">Bon Vivant + Fin Bec</span>
        </div>
        <div className="admin-metric">
          <span className="admin-metric-lbl">Pedidos pendentes</span>
          <span className="admin-metric-val">{num(pendingOrdersCount ?? 0)}</span>
          <span className="admin-metric-sub">aguardando processamento</span>
        </div>
        <div className="admin-metric">
          <span className="admin-metric-lbl">Receita realizada</span>
          <span className="admin-metric-val">{brl(totalRevenue)}</span>
          <span className="admin-metric-sub">pedidos pagos/enviados/entregues</span>
        </div>
      </div>

      <section>
        <div className="admin-toolbar">
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-heading)",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 22,
            }}
          >
            Pedidos recentes
          </h2>
          <a
            href="/admin/orders"
            style={{
              fontFamily: "var(--font-heading)",
              fontStyle: "italic",
              fontSize: 13,
              color: "var(--color-accent-700)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            ver todos →
          </a>
        </div>

        {recentOrders && recentOrders.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Data</th>
                  <th>Entrega</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="italic">
                      <a href={`/admin/orders`}>#{o.id.slice(0, 8)}</a>
                    </td>
                    <td>{new Date(o.created_at).toLocaleString("pt-BR")}</td>
                    <td className="italic">{o.delivery_method === "hoje" ? "Hoje" : "Correios"}</td>
                    <td className="tnum">{brl(Number(o.total))}</td>
                    <td>
                      <span
                        className={`admin-badge ${
                          o.status === "delivered" || o.status === "paid"
                            ? "admin-badge-active"
                            : o.status === "canceled"
                              ? "admin-badge-canceled"
                              : "admin-badge-pending"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty">
            Nenhum pedido ainda. Assim que sair a primeira compra ela aparece aqui.
          </div>
        )}
      </section>
    </>
  );
}
