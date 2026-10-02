"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (data?.role !== "admin") throw new Error("Not admin");
  return createAdminClient();
}

export async function updateSubscriptionStatus(
  subId: string,
  userId: string,
  planId: string,
  status: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await requireAdmin();
    const { error } = await admin
      .from("subscriptions")
      .update({
        status,
        canceled_at: status === "canceled" ? new Date().toISOString() : null,
      })
      .eq("id", subId);
    if (error) return { ok: false, error: error.message };

    // Mirror into profile for quick access
    const active = status === "active" || status === "trialing";
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        subscription_plan: active ? planId : null,
        subscription_status: status,
      })
      .eq("id", userId);
    if (profileError) return { ok: false, error: profileError.message };

    revalidatePath("/admin/subscriptions");
    revalidatePath("/admin/users");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
