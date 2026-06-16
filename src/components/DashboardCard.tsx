import type { ReactNode } from "react";
import Link from "next/link";

interface DashboardCardProps {
  id?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function DashboardCard({
  id,
  title,
  subtitle,
  children,
  className = "",
  action,
}: DashboardCardProps) {
  return (
    <section
      id={id}
      className={`rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-sm ${id ? "scroll-mt-24" : ""} ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-sm text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[var(--color-primary)]">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p>}
    </>
  );

  const className =
    "rounded-xl border border-[var(--color-border)] bg-[var(--color-primary-light)]/40 p-4";

  if (href) {
    return (
      <Link
        href={href}
        className={`${className} block transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]/70`}
      >
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export function QuickLinksCard({
  links,
}: {
  links: { label: string; href: string }[];
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-primary-light)]/40 p-4">
      <p className="text-sm text-[var(--color-muted)]">Quick links</p>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm font-medium text-[var(--color-primary)] hover:underline"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
