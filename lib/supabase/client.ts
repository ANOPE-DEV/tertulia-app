"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "./config";

export function createClient() {
  const { url, key } = requireSupabaseEnv();
  return createBrowserClient(url, key);
}
