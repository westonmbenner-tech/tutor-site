import { createClient } from "@supabase/supabase-js";
import { supabaseEnv, supabaseServerEnv } from "@/lib/env";

/** Privileged server client (bypasses RLS). Use sparingly. */
export function createAdminClient() {
  return createClient(supabaseEnv.url, supabaseServerEnv.secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
