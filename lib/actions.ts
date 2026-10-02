"use server";

import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/supabase/config";
import { revalidatePath } from "next/cache";

type Result<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

export async function redeemRewardAction(rewardId: string): Promise<Result<string>> {
  if (!hasSupabase()) return { ok: false, error: "Supabase não configurado." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_reward", { p_reward_id: rewardId });
  if (error) return { ok: false, error: translateDbError(error.message) };
  revalidatePath("/", "layout");
  return { ok: true, data: data as string };
}

export async function placeOrderAction(
  items: { product_id: string; quantity: number }[],
  delivery: "hoje" | "correio",
): Promise<Result<{ orderId: string; message: string }>> {
  if (!hasSupabase()) return { ok: false, error: "Supabase não configurado." };
  const supabase = await createClient();
  const shipping = delivery === "hoje" ? 15 : 0;
  const { data, error } = await supabase.rpc("place_order", {
    p_items: items,
    p_delivery: delivery,
    p_shipping: shipping,
  });
  if (error) return { ok: false, error: translateDbError(error.message) };

  const message =
    delivery === "hoje"
      ? "Entregamos hoje até as 20h. Você recebe o aviso de saída pelo WhatsApp."
      : "Enviamos o código de rastreio dos Correios assim que o pedido for postado.";

  revalidatePath("/", "layout");
  return { ok: true, data: { orderId: data as string, message } };
}

// Assinatura via Stripe: importar `createCheckoutSessionAction` diretamente de
// `@/lib/stripe/actions` na UI. Ele retorna { url } pra ser feito redirect
// client-side (window.location.href).

export async function creditPointsAction(delta: number, reason: string): Promise<Result<null>> {
  if (!hasSupabase()) return { ok: false, error: "Supabase não configurado." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("credit_points", {
    p_delta: delta,
    p_reason: reason,
  });
  if (error) return { ok: false, error: translateDbError(error.message) };
  revalidatePath("/", "layout");
  return { ok: true, data: null };
}

function translateDbError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("insufficient points")) return "Pontos insuficientes.";
  if (m.includes("insufficient stock")) return "Estoque insuficiente para um dos itens.";
  if (m.includes("not authenticated")) return "Faça login primeiro.";
  if (m.includes("reward not available")) return "Este brinde não está disponível.";
  return msg;
}
