import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/supabase/config";

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  points: number;
  level: string;
  role: "customer" | "admin";
  subscription_plan: "bon_vivant" | "fin_bec" | null;
  subscription_status: string | null;
}

export interface SubscriptionPlan {
  id: "bon_vivant" | "fin_bec";
  name: string;
  tagline: string | null;
  price_cents: number;
  description: string;
  perks: string[];
}

/** Fetch current user + profile. Returns null if not logged in or Supabase not configured. */
export async function getSessionUser(): Promise<{
  user: { id: string; email: string | null };
  profile: UserProfile;
} | null> {
  if (!hasSupabase()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, points, level, role, subscription_plan, subscription_status",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    user: { id: user.id, email: user.email ?? null },
    profile: profile as UserProfile,
  };
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  if (!hasSupabase()) return FALLBACK_PLANS;

  const supabase = await createClient();
  const { data } = await supabase
    .from("subscription_plans")
    .select("id, name, tagline, price_cents, description, perks")
    .eq("active", true)
    .order("price_cents", { ascending: true });

  if (!data || data.length === 0) return FALLBACK_PLANS;
  return data as SubscriptionPlan[];
}

/** Fallback plans used before migrations run — same content as the DB seed. */
export const FALLBACK_PLANS: SubscriptionPlan[] = [
  {
    id: "bon_vivant",
    name: "Bon Vivant",
    tagline: "Para paladares apaixonados e iniciantes.",
    price_cents: 39900,
    description:
      "Todo mês, um vinho e um queijo harmonizados escolhidos pelo sommelier, mais um mimo surpresa da casa. Entregue direto na sua porta.",
    perks: [
      "1 vinho selecionado pelo sommelier",
      "1 queijo harmonizado",
      "1 mimo surpresa da casa",
      "Cartão com nota de degustação",
      "Entrega mensal em casa",
      "Pontos em dobro nas compras avulsas",
    ],
  },
  {
    id: "fin_bec",
    name: "Fin Bec",
    tagline: "Para paladares exigentes e colecionadores.",
    price_cents: 82000,
    description:
      "Rótulos de coleção, queijos de origem e mimos exclusivos — a curadoria mais fina da casa, entregue todo mês.",
    perks: [
      "1 vinho de coleção (safra e lote limitado)",
      "1 queijo de origem controlada",
      "1 mimo exclusivo (charutos, taças, acessórios)",
      "Cartão do sommelier com harmonização",
      "Acesso antecipado a lotes limitados",
      "Sommelier disponível por WhatsApp",
      "Entrega mensal em casa",
    ],
  },
];
