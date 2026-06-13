import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/env";

export function createClient() {
  return createBrowserClient(supabaseEnv.url, supabaseEnv.publishableKey);
}
