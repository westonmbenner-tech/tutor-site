import { createClient } from "@/lib/supabase/server";
import { parseLoginHistory } from "@/lib/login-history";
import type { Profile, UserRole } from "@/lib/types";
import { roleHomePath } from "@/lib/roles";
import { redirect } from "next/navigation";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!data) return null;

  return {
    ...(data as Profile),
    login_history: parseLoginHistory((data as Profile).login_history),
  };
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  return user;
}

export async function requireRole(allowed: UserRole[]) {
  const profile = await getProfile();
  if (!profile) redirect("/");
  if (!allowed.includes(profile.role)) {
    redirect(roleHomePath(profile.role));
  }
  return profile;
}

export async function requireAdmin() {
  return requireRole(["admin"]);
}

export async function requireStudent() {
  return requireRole(["student"]);
}

export async function requireParent() {
  return requireRole(["parent"]);
}

export { roleHomePath } from "@/lib/roles";

export async function getStudentForProfile(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("*")
    .eq("profile_id", profileId)
    .eq("active", true)
    .maybeSingle();
  return data;
}

export async function getParentForProfile(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("parents")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  return data;
}

export async function canAccessStudent(
  profile: Profile,
  studentId: string
): Promise<boolean> {
  if (profile.role === "admin") return true;

  const supabase = await createClient();

  if (profile.role === "student") {
    const { data } = await supabase
      .from("students")
      .select("id")
      .eq("id", studentId)
      .eq("profile_id", profile.id)
      .maybeSingle();
    return !!data;
  }

  if (profile.role === "parent") {
    const parent = await getParentForProfile(profile.id);
    if (!parent) return false;
    const { data } = await supabase
      .from("parent_student_links")
      .select("id")
      .eq("parent_id", parent.id)
      .eq("student_id", studentId)
      .maybeSingle();
    return !!data;
  }

  return false;
}
