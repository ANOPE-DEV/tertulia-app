import Link from "next/link";
import "./checkout.css";

export default async function CheckoutCanceled({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const planName =
    params.plan === "bon_vivant" ? "Bon Vivant" : params.plan === "fin_bec" ? "Fin Bec" : null;

  return (
    <div className="checkout-wrap">
      <div className="checkout-card">
        <span className="checkout-kicker">Compra cancelada</span>
        <h1 className="checkout-title">
          Você não completou a assinatura{planName ? ` ${planName}` : ""}.
        </h1>
        <p className="checkout-body">
          Nada foi cobrado. Se mudar de ideia, pode voltar ao Clube a qualquer
          momento e clicar em Assinar novamente.
        </p>
        <div className="checkout-actions">
          <Link href="/" className="checkout-btn checkout-btn-primary">
            Voltar ao app
          </Link>
        </div>
      </div>
    </div>
  );
}
