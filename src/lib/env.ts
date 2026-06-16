function requireEnv(
  value: string | undefined,
  name: string
): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and set the value.`
    );
  }
  return value;
}

/**
 * Public Supabase config from .env.local (loaded automatically by Next.js).
 * Uses static process.env access so NEXT_PUBLIC_* values are inlined in
 * middleware and client bundles.
 */
export const supabaseEnv = {
  url: requireEnv(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL"
  ),
  publishableKey: requireEnv(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
  ),
  callbackUrl: requireEnv(
    process.env.NEXT_PUBLIC_SUPABASE_CALLBACK,
    "NEXT_PUBLIC_SUPABASE_CALLBACK"
  ),
} as const;

/** Server-only Supabase secret key — import only from server modules. */
export const supabaseServerEnv = {
  get secretKey() {
    return requireEnv(process.env.SUPABASE_SECRET_KEY, "SUPABASE_SECRET_KEY");
  },
} as const;
