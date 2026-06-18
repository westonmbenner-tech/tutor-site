import Link from "next/link";
import { TimezoneProvider } from "@/components/timezone/TimezoneProvider";
import { TimezoneSelector } from "@/components/timezone/TimezoneSelector";
import type { NotificationSummary } from "@/lib/notifications";
import type { UserRole } from "@/lib/types";

interface NavLink {
  href: string;
  label: string;
}

const navByRole: Record<UserRole, NavLink[]> = {
  student: [
    { href: "/dashboard", label: "Today" },
    { href: "/dashboard/homework", label: "Homework" },
    { href: "/dashboard/mistakes", label: "Lessons learned" },
    { href: "/dashboard/messages", label: "Messages" },
    { href: "/dashboard/ai-summary", label: "AI Insights" },
  ],
  admin: [
    { href: "/admin", label: "Overview" },
    { href: "/admin/students", label: "Students" },
    { href: "/admin/homework", label: "Homework" },
    { href: "/admin/messages", label: "Messages" },
    { href: "/admin/parents", label: "Parents" },
  ],
  parent: [
    { href: "/parent", label: "Overview" },
    { href: "/parent/messages", label: "Messages" },
  ],
};

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--color-danger)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function AppShell({
  role,
  userName,
  notifications,
  children,
}: {
  role: UserRole;
  userName: string;
  notifications?: NotificationSummary;
  children: React.ReactNode;
}) {
  const links = navByRole[role];
  const navBadges = notifications?.navBadges ?? {};

  return (
    <TimezoneProvider>
      <div className="flex min-h-full flex-col">
        <header className="border-b border-[var(--color-border)] bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div>
              <p className="text-sm text-[var(--color-muted)]">TutorCheck</p>
              <p className="font-medium text-slate-800">{userName}</p>
            </div>
            <nav className="flex flex-wrap gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
                >
                  {link.label}
                  <NavBadge count={navBadges[link.href] ?? 0} />
                </Link>
              ))}
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <TimezoneSelector />
              <form action="/api/auth/signout" method="post">
                <button type="submit" className="btn btn-secondary text-sm">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </TimezoneProvider>
  );
}
