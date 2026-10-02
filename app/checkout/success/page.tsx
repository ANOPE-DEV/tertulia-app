import Link from "next/link";
import { getStripe, hasStripe } from "@/lib/stripe/client";
import "./checkout.css";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccess({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  let planName: string | null = null;
  let amountFmt: string | null = null;

  if (params.session_id && hasStripe()) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(params.session_id, {
        expand: ["line_items", "line_items.data.price.product"],
      });
      const line = session.line_items?.data[0];
      const product = line?.price?.product;
      planName =
        typeof product === "object" && product && !("deleted" in product)
          ? product.name
          : null;
      if (session.amount_total !== null) {
        amountFmt = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: session.currency?.toUpperCase() ?? "BRL",
        }).format(session.amount_total / 100);
      }
    } catch {
      // Falha silenciosa — mostra mensagem genérica
    }
  }

  return (
    <div className="checkout-wrap">
      <div className="checkout-card">
        <span className="checkout-kicker">Assinatura confirmada</span>
        <h1 className="checkout-title">
          Bem-vindo{planName ? ` ao ${planName}` : ""}.
        </h1>
        <p className="checkout-body">
          Sua assinatura está ativa. A primeira caixa é preparada pelo sommelier
          e entregue em casa nos próximos dias. Você recebe atualizações por email
          e WhatsApp.
        </p>
        {amountFmt && (
          <p className="checkout-fine">
            Cobrança recorrente de <strong>{amountFmt}/mês</strong>. Você pode
            cancelar a qualquer momento no seu Clube.
          </p>
        )}
        <div className="checkout-actions">
          <Link href="/" className="checkout-btn checkout-btn-primary">
            Voltar ao app
          </Link>
        </div>
      </div>
    </div>
  );
}
