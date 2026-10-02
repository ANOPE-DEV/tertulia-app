import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/supabase/config";
import { signOutAction } from "@/lib/auth/actions";
import "./admin.css";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabase()) {
    return (
      <div className="admin" style={{ gridTemplateColumns: "1fr" }}>
        <main className="admin-main" style={{ maxWidth: 720 }}>
          <div className="admin-hd">
            <div className="admin-hd-l">
              <span className="admin-hd-kicker">Painel administrativo</span>
              <h1>Configuração pendente</h1>
            </div>
          </div>
          <div className="admin-empty">
            <p>
              <strong>Supabase não configurado.</strong>
              <br />
              Preencha <code>.env.local</code> com <code>NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> e{" "}
              <code>SUPABASE_SERVICE_ROLE_KEY</code>, rode as migrations SQL no dashboard e
              reinicie o servidor.
            </p>
            <p style={{ marginTop: 16 }}>
              <Link href="/" style={{ color: "var(--color-accent-700)" }}>
                ← Voltar ao app
              </Link>
            </p>
          </div>
        </main>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return (
      <div className="admin" style={{ gridTemplateColumns: "1fr" }}>
        <main className="admin-main" style={{ maxWidth: 720 }}>
          <div className="admin-hd">
            <div className="admin-hd-l">
              <span className="admin-hd-kicker">Painel administrativo</span>
              <h1>Acesso restrito</h1>
            </div>
          </div>
          <div className="admin-empty">
            <p>
              <strong>Você não tem permissão de admin.</strong>
              <br />
              Peça a um admin existente para promover seu perfil, ou rode no SQL Editor
              do Supabase:
            </p>
            <p style={{ marginTop: 12 }}>
              <code>
                update profiles set role = &apos;admin&apos; where email = &apos;{user.email}&apos;;
              </code>
            </p>
            <p style={{ marginTop: 16 }}>
              <Link href="/" style={{ color: "var(--color-accent-700)" }}>
                ← Voltar ao app
              </Link>
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin">
      <aside className="admin-aside">
        <div className="admin-brand">
          <span className="admin-brand-name">Tertúlia</span>
          <span className="admin-brand-tag">PAINEL ADMIN</span>
        </div>
        <nav className="admin-nav">
          <span className="admin-nav-lbl">Visão geral</span>
          <Link href="/admin">Dashboard</Link>

          <span className="admin-nav-lbl">Loja</span>
          <Link href="/admin/products">Produtos</Link>
          <Link href="/admin/kits">Kits</Link>
          <Link href="/admin/orders">Pedidos</Link>

          <span className="admin-nav-lbl">Comunidade</span>
          <Link href="/admin/users">Usuários</Link>
          <Link href="/admin/subscriptions">Assinaturas</Link>
          <Link href="/admin/rewards">Brindes</Link>
        </nav>

        <div className="admin-user">
          <span className="admin-user-name">{profile.full_name || "Admin"}</span>
          <span className="admin-user-email">{profile.email}</span>
          <form action={async () => { "use server"; await signOutAction(); redirect("/"); }}>
            <button type="submit" className="admin-user-back">
              Sair ↗
            </button>
          </form>
          <Link href="/" className="admin-user-back">
            ← Voltar ao app
          </Link>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}
