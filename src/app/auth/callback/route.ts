import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { roleHomePath } from "@/lib/roles";
import type { UserRole } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
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

  return NextResponse.redirect(`${origin}${destination}`);
}
