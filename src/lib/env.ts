function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and set the value.`
    );
  }
  return value;
}

/** Public Supabase config — safe for browser and SSR clients. */
export const supabaseEnv = {
  get url() {
    return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  },
  get publishableKey() {
    return requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  },
} as const;

/** Server-only Supabase secret key — import only from server modules. */
export const supabaseServerEnv = {
  get secretKey() {
    return requireEnv("SUPABASE_SECRET_KEY");
  },
} as const;
