import { createClient } from "@/lib/supabase/server";
import { num } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminRewards() {
  const supabase = await createClient();
  const { data: rewards } = await supabase
    .from("rewards")
    .select("*")
    .order("sort_order");

  const { data: redemptions } = await supabase
    .from("redemptions")
    .select(`
      id, cost_paid, status, created_at,
      profiles:user_id ( full_name, email ),
      rewards:reward_id ( name )
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <>
      <div className="admin-hd">
        <div className="admin-hd-l">
          <span className="admin-hd-kicker">Comunidade</span>
          <h1>Brindes</h1>
        </div>
      </div>

      <section style={{ marginBottom: 32 }}>
        <h2
          style={{
            margin: "0 0 12px",
            fontFamily: "var(--font-heading)",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 20,
          }}
        >
          Catálogo
        </h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Custo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(rewards ?? []).map((r) => (
                <tr key={r.id}>
                  <td style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12 }}>
                    {r.id}
                  </td>
                  <td className="italic">{r.name}</td>
                  <td className="tnum">{num(r.cost)} pts</td>
                  <td>
                    <span className={`admin-badge ${r.active ? "admin-badge-active" : "admin-badge-canceled"}`}>
                      {r.active ? "ativo" : "inativo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2
          style={{
            margin: "0 0 12px",
            fontFamily: "var(--font-heading)",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 20,
          }}
        >
          Resgates recentes
        </h2>
        {!redemptions || redemptions.length === 0 ? (
          <div className="admin-empty">Nenhum resgate ainda.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Brinde</th>
                  <th>Custo</th>
                  <th>Data</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map((r) => {
                  const rawProfile = r.profiles as
                    | { full_name?: string | null; email?: string | null }
                    | Array<{ full_name?: string | null; email?: string | null }>
                    | null;
                  const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
                  const rawReward = r.rewards as
                    | { name?: string | null }
                    | Array<{ name?: string | null }>
                    | null;
                  const reward = Array.isArray(rawReward) ? rawReward[0] : rawReward;
                  return (
                    <tr key={r.id}>
                      <td className="italic">
                        {profile?.full_name ?? "—"}
                        <br />
                        <span style={{ fontSize: 11, color: "var(--color-neutral-600)" }}>
                          {profile?.email}
                        </span>
                      </td>
                      <td className="italic">{reward?.name ?? "—"}</td>
                      <td className="tnum">{num(r.cost_paid)}</td>
                      <td style={{ fontSize: 12 }}>
                        {new Date(r.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td>
                        <span className={`admin-badge ${r.status === "delivered" ? "admin-badge-active" : "admin-badge-pending"}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
