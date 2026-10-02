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
  return { admin: createAdminClient(), currentId: user.id };
}

export async function updateUserRole(userId: string, role: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { admin, currentId } = await requireAdmin();
    if (userId === currentId && role !== "admin") {
      return { ok: false, error: "Você não pode remover seu próprio acesso admin aqui." };
    }
    const { error } = await admin.from("profiles").update({ role }).eq("id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
