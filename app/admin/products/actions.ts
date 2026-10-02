"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

interface ProductInput {
  id: string;
  cat: "queijos" | "vinhos" | "charutos" | "casa" | "kit";
  name: string;
  origin: string;
  price: number;
  old_price: number | null;
  unit: string;
  stock: number;
  badge: string | null;
  description: string;
  sommelier_note: string | null;
  active: boolean;
}

export async function createProduct(input: ProductInput): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await requireAdmin();
    const { error } = await admin.from("products").insert(input);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/products");
    revalidatePath("/admin/kits");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await requireAdmin();
    const { error } = await admin.from("products").update(input).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/products");
    revalidatePath("/admin/kits");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteProduct(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await requireAdmin();
    // Soft delete: mark inactive to preserve order history
    const { error } = await admin.from("products").update({ active: false }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/products");
    revalidatePath("/admin/kits");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function createAndRedirect(input: ProductInput) {
  const res = await createProduct(input);
  if (res.ok) redirect("/admin/products");
  return res;
}
