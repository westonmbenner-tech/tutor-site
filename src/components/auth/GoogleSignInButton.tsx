"use client";

import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton() {
  async function handleSignIn() {
    const supabase = createClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
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
