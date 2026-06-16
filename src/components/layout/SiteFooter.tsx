import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-white px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 text-center text-xs text-[var(--color-muted)] sm:flex-row sm:justify-between sm:text-left">
        <p>© 2026 TutorCheck</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link href="/privacy" className="hover:text-[var(--color-primary)]">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-[var(--color-primary)]">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
