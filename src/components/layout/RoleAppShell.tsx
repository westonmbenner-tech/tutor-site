import { AppShell } from "@/components/layout/AppShell";
import { getNotificationSummary, type NotificationSummary } from "@/lib/notifications";
import type { Profile, UserRole } from "@/lib/types";

export async function RoleAppShell({
  profile,
  userName,
  role,
  notifications,
  children,
}: {
  profile: Profile;
  userName?: string;
  role?: UserRole;
  notifications?: NotificationSummary;
  children: React.ReactNode;
}) {
  const effectiveRole = role ?? profile.role;
  const effectiveNotifications =
    notifications ?? (await getNotificationSummary(profile));

  return (
    <AppShell
      role={effectiveRole}
      userName={userName ?? profile.full_name ?? "User"}
      notifications={effectiveNotifications}
    >
      {children}
    </AppShell>
  );
}
