import type { UserRole } from "@/lib/types";

export function roleHomePath(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "parent":
      return "/parent";
    case "student":
    default:
      return "/dashboard";
  }
}
