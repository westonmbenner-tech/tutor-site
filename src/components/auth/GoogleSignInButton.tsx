"use client";

import { createClient } from "@/lib/supabase/client";
import { authCallbackUrl } from "@/lib/env";

export function GoogleSignInButton() {
  async function handleSignIn() {
    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: authCallbackUrl(window.location.origin),
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
