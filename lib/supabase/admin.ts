import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./config";

/** Service-role client. NEVER use from the browser or expose keys.
 *  Only from server actions/route handlers reserved for admin operations. */
export function createAdminClient() {
  const { url } = requireSupabaseEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
