import TertuliaApp from "@/components/tertulia-app";
import { getSessionUser, getSubscriptionPlans } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSessionUser();
  const plans = await getSubscriptionPlans();
  return <TertuliaApp initialSession={session} plans={plans} />;
}
