"use client";

import { createClient } from "@/lib/supabase/client";
import { supabaseEnv } from "@/lib/env";

export function GoogleSignInButton() {
  async function handleSignIn() {
    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: supabaseEnv.callbackUrl,
      },
    });
  }

  return (
    <button
      type="button"
      onClick={handleSignIn}
      className="btn btn-primary w-full py-3 text-base"
    >
      Continue with Google
    </button>
  );
}
