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

export async function updateOrderStatus(orderId: string, status: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await requireAdmin();
    const { error } = await admin.from("orders").update({ status }).eq("id", orderId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
