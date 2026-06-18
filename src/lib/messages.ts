import type { UserRole } from "@/lib/types";
import {
  DEFAULT_DISPLAY_TIMEZONE,
  formatDisplayDateTime,
  type DisplayTimezone,
} from "@/lib/timezone";

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

export function formatMessageTime(
  iso: string,
  timezone: DisplayTimezone = DEFAULT_DISPLAY_TIMEZONE
): string {
  return formatDisplayDateTime(iso, timezone);
}
