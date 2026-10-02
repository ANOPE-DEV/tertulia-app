import { createClient } from "@/lib/supabase/server";
import { brl } from "@/lib/data";
import { OrderStatusForm } from "./status-form";

export const dynamic = "force-dynamic";

export default async function AdminOrders() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id, user_id, subtotal, shipping, total, delivery_method,
      status, points_earned, created_at,
      profiles:user_id ( full_name, email )
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <>
      <div className="admin-hd">
        <div className="admin-hd-l">
          <span className="admin-hd-kicker">Loja</span>
          <h1>Pedidos</h1>
        </div>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="admin-empty">Nenhum pedido ainda.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Entrega</th>
                <th>Total</th>
                <th>Pts</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                // supabase-js typings return joined rows as either an object or an array;
                // normalize to a single profile.
                const rawProfile = o.profiles as
                  | { full_name?: string | null; email?: string | null }
                  | Array<{ full_name?: string | null; email?: string | null }>
                  | null;
                const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
                return (
                  <tr key={o.id}>
                    <td style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12 }}>
                      #{o.id.slice(0, 8)}
                    </td>
                    <td className="italic">
                      {profile?.full_name ?? "—"}
                      <br />
                      <span style={{ fontSize: 11, color: "var(--color-neutral-600)" }}>
                        {profile?.email}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {new Date(o.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="italic">
                      {o.delivery_method === "hoje" ? "Hoje" : "Correios"}
                    </td>
                    <td className="tnum">{brl(Number(o.total))}</td>
                    <td className="tnum" style={{ color: "var(--color-accent-700)" }}>
                      +{o.points_earned}
                    </td>
                    <td>
                      <OrderStatusForm orderId={o.id} currentStatus={o.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
