import type { Profile, SignupRole } from "@/lib/types";

export function needsRoleSelection(profile: Profile): boolean {
  return profile.role !== "admin" && !profile.requested_role;
}

export function roleLabel(role: SignupRole): string {
  return role === "parent" ? "Parent" : "Student";
}
