import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, hasStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabase } from "@/lib/supabase/config";

export const runtime = "nodejs";

/** Stripe webhook receiver.
 *
 *  Configure no dashboard do Stripe:
 *    URL:     https://SEU-DOMINIO/api/stripe/webhook
 *    Eventos: checkout.session.completed
 *             customer.subscription.updated
 *             customer.subscription.deleted
 *             invoice.payment_succeeded (opcional, para tracking)
 *             invoice.payment_failed (opcional, para tracking)
 *
 *  Depois pegue o Signing secret e coloque em STRIPE_WEBHOOK_SECRET.
 *
 *  Para testes locais: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
 */
export async function POST(request: Request) {
  if (!hasStripe() || !hasSupabase()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe-webhook] signature verification failed:", msg);
    return NextResponse.json({ error: `Invalid signature: ${msg}` }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // Session já cria subscription; vamos populá-la a partir do subscription.
        const subscriptionId = session.subscription as string | null;
        const userId = session.metadata?.supabase_user_id;
        const planId = session.metadata?.plan_id;
        if (!subscriptionId || !userId || !planId) {
          console.warn("[stripe-webhook] checkout.session.completed missing fields", {
            subscriptionId,
            userId,
            planId,
          });
          break;
        }
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const period = getSubscriptionPeriod(subscription);
        await upsertSubscription(admin, {
          userId,
          planId,
          subscriptionId,
          status: subscription.status,
          currentPeriodStart: period.start,
          currentPeriodEnd: period.end,
        });
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const period = getSubscriptionPeriod(subscription);
        const userId = subscription.metadata?.supabase_user_id;
        const planId = subscription.metadata?.plan_id;
        if (!userId || !planId) {
          // Buscar pelo customer_id (fallback quando webhook chega antes de checkout metadata)
          const { data: profile } = await admin
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", subscription.customer as string)
            .maybeSingle();
          if (!profile) {
            console.warn("[stripe-webhook] subscription event with no matching user");
            break;
          }
          const priceId = subscription.items.data[0]?.price.id;
          const { data: plan } = await admin
            .from("subscription_plans")
            .select("id")
            .eq("stripe_price_id", priceId)
            .maybeSingle();
          if (!plan) {
            console.warn("[stripe-webhook] no plan matches price", priceId);
            break;
          }
          await upsertSubscription(admin, {
            userId: profile.id,
            planId: plan.id,
            subscriptionId: subscription.id,
            status: subscription.status,
            currentPeriodStart: period.start,
            currentPeriodEnd: period.end,
          });
        } else {
          await upsertSubscription(admin, {
            userId,
            planId,
            subscriptionId: subscription.id,
            status: subscription.status,
            currentPeriodStart: period.start,
            currentPeriodEnd: period.end,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await admin
          .from("subscriptions")
          .update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        // Limpar do profile
        const { data: sub } = await admin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .maybeSingle();
        if (sub) {
          await admin
            .from("profiles")
            .update({
              subscription_plan: null,
              subscription_status: "canceled",
              subscription_current_period_end: null,
            })
            .eq("id", sub.user_id);
        }
        break;
      }

      default:
        // Outros eventos (invoice.*, etc) ignorados por enquanto
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe-webhook] handler error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

/** Stripe v18+ moveu current_period_start/end pra dentro de items.data[0].
 *  Retorna Unix timestamps (segundos). */
function getSubscriptionPeriod(subscription: Stripe.Subscription): {
  start: number;
  end: number;
} {
  const item = subscription.items.data[0];
  return {
    start: item?.current_period_start ?? Math.floor(Date.now() / 1000),
    end: item?.current_period_end ?? Math.floor(Date.now() / 1000),
  };
}

/** Upsert row em subscriptions + mirror em profiles pra leitura rápida no app. */
async function upsertSubscription(
  admin: ReturnType<typeof createAdminClient>,
  args: {
    userId: string;
    planId: string;
    subscriptionId: string;
    status: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
  },
) {
  const startISO = new Date(args.currentPeriodStart * 1000).toISOString();
  const endISO = new Date(args.currentPeriodEnd * 1000).toISOString();

  // 1. upsert em subscriptions (por stripe_subscription_id)
  const { data: existing } = await admin
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", args.subscriptionId)
    .maybeSingle();

  if (existing) {
    await admin
      .from("subscriptions")
      .update({
        status: args.status,
        current_period_start: startISO,
        current_period_end: endISO,
        canceled_at: args.status === "canceled" ? new Date().toISOString() : null,
      })
      .eq("id", existing.id);
  } else {
    await admin.from("subscriptions").insert({
      user_id: args.userId,
      plan_id: args.planId,
      status: args.status,
      stripe_subscription_id: args.subscriptionId,
      current_period_start: startISO,
      current_period_end: endISO,
    });
  }

  // 2. mirror em profiles pra acesso rápido no app (evita join a cada render)
  const active = args.status === "active" || args.status === "trialing";
  await admin
    .from("profiles")
    .update({
      subscription_plan: active ? args.planId : null,
      subscription_status: args.status,
      subscription_current_period_end: endISO,
    })
    .eq("id", args.userId);
}
