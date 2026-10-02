import { createClient } from "@/lib/supabase/server";
import { num } from "@/lib/data";
import { UserRoleForm } from "./role-form";

export const dynamic = "force-dynamic";

export default async function AdminUsers() {
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, points, level, role, subscription_plan, subscription_status, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <>
      <div className="admin-hd">
        <div className="admin-hd-l">
          <span className="admin-hd-kicker">Comunidade</span>
          <h1>Usuários</h1>
        </div>
      </div>

      {!users || users.length === 0 ? (
        <div className="admin-empty">Nenhum usuário cadastrado ainda.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Nível</th>
                <th>Pontos</th>
                <th>Assinatura</th>
                <th>Cadastro</th>
                <th>Papel</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="italic">{u.full_name ?? "—"}</td>
                  <td style={{ fontSize: 12 }}>{u.email}</td>
                  <td>
                    <span
                      className={`admin-badge ${
                        u.level === "Mestre" || u.level === "Connoisseur"
                          ? "admin-badge-admin"
                          : "admin-badge-pending"
                      }`}
                    >
                      {u.level}
                    </span>
                  </td>
                  <td className="tnum">{num(u.points)}</td>
                  <td className="italic" style={{ fontSize: 12 }}>
                    {u.subscription_plan ? (
                      <>
                        {u.subscription_plan}
                        <br />
                        <span style={{ fontSize: 10, color: "var(--color-neutral-600)" }}>
                          {u.subscription_status}
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ fontSize: 11 }}>
                    {new Date(u.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td>
                    <UserRoleForm userId={u.id} currentRole={u.role} />
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
