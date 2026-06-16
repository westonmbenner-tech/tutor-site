import Link from "next/link";
import type { ReactNode } from "react";

export function LegalPageShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex-1 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 border-b border-[var(--color-border)] pb-6">
          <Link
            href="/"
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            ← Back to home
          </Link>
          <h1 className="mt-4 text-3xl font-semibold text-slate-800">{title}</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            TutorCheck · tutor-check.com
          </p>
        </header>

        <article className="prose-legal space-y-6 text-sm leading-relaxed text-slate-700">
          {children}
        </article>
      </div>
    </div>
  );
}
