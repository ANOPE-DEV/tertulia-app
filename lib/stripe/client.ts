import Stripe from "stripe";

export function hasStripe(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return !!(key && !key.startsWith("sk_test_...") && key.startsWith("sk_"));
}

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurada.");
  _stripe = new Stripe(key, {
    // Não passar apiVersion — SDK usa a mais recente que ele conhece
    typescript: true,
  });
  return _stripe;
}
