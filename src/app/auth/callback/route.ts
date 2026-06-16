import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseEnv } from "@/lib/env";
import { roleHomePath } from "@/lib/roles";
import type { UserRole } from "@/lib/types";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const cookieStore = await cookies();
  const cookiesToApply: CookieToSet[] = [];
  const headersToApply: Record<string, string> = {};

  const supabase = createServerClient(
    supabaseEnv.url,
    supabaseEnv.publishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // cookieStore.set can fail in some server contexts; response cookies still apply.
            }
            cookiesToApply.push({ name, value, options });
          });
          if (headers) {
            Object.assign(headersToApply, headers);
          }
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback exchange failed:", error.message);
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let destination = "/onboarding";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, requested_role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "admin") {
      destination = roleHomePath("admin");
    } else if (profile?.requested_role) {
      destination = roleHomePath(profile.role as UserRole);
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const redirectBase =
    !isLocalEnv && forwardedHost ? `https://${forwardedHost}` : origin;

  const response = NextResponse.redirect(`${redirectBase}${destination}`);

  cookiesToApply.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  Object.entries(headersToApply).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
