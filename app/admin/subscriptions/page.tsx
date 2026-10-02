import { createClient } from "@/lib/supabase/server";
import { SubStatusForm } from "./status-form";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptions() {
  const supabase = await createClient();
  const { data: subs } = await supabase
    .from("subscriptions")
    .select(`
      id, user_id, plan_id, status, current_period_end, created_at,
      profiles:user_id ( full_name, email )
    `)
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <>
      <div className="admin-hd">
        <div className="admin-hd-l">
          <span className="admin-hd-kicker">Comunidade</span>
          <h1>Assinaturas</h1>
        </div>
      </div>

      {!subs || subs.length === 0 ? (
        <div className="admin-empty">
          Nenhuma assinatura ainda. Aparecerão aqui as intenções de assinatura (status{" "}
          <code>incomplete</code>) até o Stripe processar (Etapa 2), quando você poderá
          ativá-las aqui manualmente ou via webhook.
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Plano</th>
                <th>Data</th>
                <th>Válido até</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => {
                const rawProfile = s.profiles as
                  | { full_name?: string | null; email?: string | null }
                  | Array<{ full_name?: string | null; email?: string | null }>
                  | null;
                const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
                return (
                  <tr key={s.id}>
                    <td className="italic">
                      {profile?.full_name ?? "—"}
                      <br />
                      <span style={{ fontSize: 11, color: "var(--color-neutral-600)" }}>
                        {profile?.email}
                      </span>
                    </td>
                    <td className="italic">{s.plan_id}</td>
                    <td style={{ fontSize: 12 }}>
                      {new Date(s.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {s.current_period_end
                        ? new Date(s.current_period_end).toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                    <td>
                      <SubStatusForm
                        subId={s.id}
                        userId={s.user_id}
                        planId={s.plan_id}
                        currentStatus={s.status}
                      />
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
