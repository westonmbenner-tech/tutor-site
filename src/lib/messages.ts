import type { UserRole } from "@/lib/types";

export function authorRoleLabel(role: UserRole | undefined): string {
  switch (role) {
    case "admin":
      return "Tutor";
    case "parent":
      return "Parent";
    case "student":
    default:
      return "Student";
  }
}

export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
