import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-800">
            Study Portal
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Sign in to log study sessions, track homework, and review progress.
          </p>
        </div>
        <GoogleSignInButton />
        <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
          A calm space for consistent, accountable learning.
        </p>
      </div>
    </div>
  );
}
