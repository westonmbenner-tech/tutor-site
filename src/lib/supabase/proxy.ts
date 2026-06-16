import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/env";

type CookieHandler = {
  getAll: () => ReturnType<NextRequest["cookies"]["getAll"]>;
  setAll: (
    cookiesToSet: {
      name: string;
      value: string;
      options: Parameters<NextResponse["cookies"]["set"]>[2];
    }[],
    headers?: Record<string, string>
  ) => void;
};

export function createSupabaseMiddlewareClient(
  request: NextRequest,
  onResponse: (response: NextResponse) => void
) {
  let response = NextResponse.next({ request });

  const cookies: CookieHandler = {
    getAll() {
      return request.cookies.getAll();
    },
    setAll(cookiesToSet, headers) {
      cookiesToSet.forEach(({ name, value }) =>
        request.cookies.set(name, value)
      );
      response = NextResponse.next({ request });
      cookiesToSet.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options)
      );
      if (headers) {
        Object.entries(headers).forEach(([key, value]) =>
          response.headers.set(key, value)
        );
      }
      onResponse(response);
    },
  };

  const supabase = createServerClient(
    supabaseEnv.url,
    supabaseEnv.publishableKey,
    { cookies }
  );

  return { supabase, getResponse: () => response };
}

export function redirectWithSession(
  request: NextRequest,
  pathname: string,
  sessionResponse: NextResponse
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const redirectResponse = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  ["cache-control", "expires", "pragma"].forEach((header) => {
    const value = sessionResponse.headers.get(header);
    if (value) redirectResponse.headers.set(header, value);
  });
  return redirectResponse;
}
