"use server";

import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/supabase/config";
import { revalidatePath } from "next/cache";

// Auth mutations (signUp / signInWithPassword / signInWithOAuth) run browser-side
// via `createBrowserClient` — see components/auth/auth-sheet.tsx.
// Only server-side action here is signOut, which clears the httpOnly cookie
// that the middleware refreshes.

export async function signOutAction() {
  if (!hasSupabase()) return;
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
