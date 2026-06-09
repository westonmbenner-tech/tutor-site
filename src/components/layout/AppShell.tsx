import Link from "next/link";
import type { UserRole } from "@/lib/types";

interface NavLink {
  href: string;
  label: string;
}

const navByRole: Record<UserRole, NavLink[]> = {
  student: [
    { href: "/dashboard", label: "Today" },
    { href: "/dashboard/homework", label: "Homework" },
    { href: "/dashboard/mistakes", label: "Mistakes" },
    { href: "/dashboard/ai-summary", label: "AI Insights" },
  ],
  admin: [
    { href: "/admin", label: "Overview" },
    { href: "/admin/students", label: "Students" },
    { href: "/admin/homework", label: "Homework" },
    { href: "/admin/parents", label: "Parents" },
  ],
  parent: [{ href: "/parent", label: "Overview" }],
};

export function AppShell({
  role,
  userName,
  children,
}: {
  role: UserRole;
  userName: string;
  children: React.ReactNode;
}) {
  const links = navByRole[role];

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-sm text-[var(--color-muted)]">Study Portal</p>
            <p className="font-medium text-slate-800">{userName}</p>
          </div>
          <nav className="flex flex-wrap gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="btn btn-secondary text-sm">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
