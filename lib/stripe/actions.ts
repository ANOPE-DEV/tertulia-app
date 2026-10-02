"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL, hasSupabase } from "@/lib/supabase/config";
import { getStripe, hasStripe } from "./client";

type Result<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

/** Create (or reuse) a Stripe Checkout Session for the given plan and redirect the user to it. */
export async function createCheckoutSessionAction(
  planId: "bon_vivant" | "fin_bec",
): Promise<Result<{ url: string }>> {
  if (!hasSupabase()) return { ok: false, error: "Supabase não configurado." };
  if (!hasStripe()) return { ok: false, error: "Stripe não configurado — preencha STRIPE_SECRET_KEY no .env.local." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Faça login primeiro." };

  // Buscar dados do profile (para stripe_customer_id existente + email)
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, stripe_customer_id")
    .eq("id", user.id)
    .single();
  if (!profile) return { ok: false, error: "Profile não encontrado." };

  // Buscar o Stripe Price ID do plano
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("id, name, stripe_price_id, price_cents")
    .eq("id", planId)
    .single();
  if (!plan) return { ok: false, error: "Plano não encontrado." };
  if (!plan.stripe_price_id) {
    return {
      ok: false,
      error: `Plano ${plan.name} ainda não tem stripe_price_id. Configure no Stripe dashboard e cole em subscription_plans.`,
    };
  }

  const stripe = getStripe();

  // Reusar ou criar customer no Stripe
  let customerId = profile.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email ?? user.email ?? undefined,
      name: profile.full_name ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    // Persistir customer_id via service role (bypass RLS pra evitar race)
    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  // Criar Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/checkout/canceled?plan=${planId}`,
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
        plan_id: planId,
      },
    },
    metadata: {
      supabase_user_id: user.id,
      plan_id: planId,
    },
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    locale: "pt-BR",
  });

  if (!session.url) return { ok: false, error: "Stripe não retornou URL de checkout." };

  return { ok: true, data: { url: session.url } };
}

/** Convenience: create checkout session then redirect (call from server components/forms). */
export async function subscribeAndRedirect(planId: "bon_vivant" | "fin_bec") {
  const res = await createCheckoutSessionAction(planId);
  if (res.ok) redirect(res.data.url);
  return res;
}

/** Open Stripe's Customer Billing Portal for the current user. */
export async function createBillingPortalSessionAction(): Promise<Result<{ url: string }>> {
  if (!hasSupabase()) return { ok: false, error: "Supabase não configurado." };
  if (!hasStripe()) return { ok: false, error: "Stripe não configurado." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Faça login primeiro." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();
  if (!profile?.stripe_customer_id) {
    return { ok: false, error: "Nenhuma assinatura ativa pra gerenciar." };
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${SITE_URL}/`,
  });

  return { ok: true, data: { url: session.url } };
}
