import { NextResponse, type NextRequest } from "next/server";
import {
  createSupabaseMiddlewareClient,
  redirectWithSession,
} from "@/lib/supabase/proxy";
import { recordLoginIfNeeded } from "@/lib/record-login";
import { roleHomePath } from "@/lib/roles";
import type { UserRole } from "@/lib/types";

const publicRoutePrefixes = ["/privacy", "/terms"];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return publicRoutePrefixes.some((route) => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  let sessionResponse = NextResponse.next({ request });
  const { supabase, getResponse } = createSupabaseMiddlewareClient(
    request,
    (response) => {
      sessionResponse = response;
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  sessionResponse = getResponse();

  const isPublic = isPublicPath(pathname);

  if (!user && !isPublic) {
    return redirectWithSession(request, "/", sessionResponse);
  }

  if (user) {
    await recordLoginIfNeeded(supabase, request.cookies, {
      set: (name, value, options) => {
        sessionResponse.cookies.set(name, value, options);
      },
    });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, requested_role")
      .eq("id", user.id)
      .maybeSingle();

    const needsOnboarding =
      profile &&
      profile.role !== "admin" &&
      !profile.requested_role &&
      pathname !== "/onboarding";

    if (needsOnboarding) {
      return redirectWithSession(request, "/onboarding", sessionResponse);
    }

    if (pathname === "/") {
      const destination = profile?.role
        ? profile.role === "admin"
          ? roleHomePath("admin")
          : profile.requested_role
            ? roleHomePath(profile.role as UserRole)
            : "/onboarding"
        : "/onboarding";

      return redirectWithSession(request, destination, sessionResponse);
    }
  }

  return sessionResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|auth/callback).*)"],
};
