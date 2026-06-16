import Image from "next/image";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const authFailed = params.error === "auth";

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <Image
            src="/tutorcheck-logo.png"
            alt="TutorCheck"
            width={280}
            height={72}
            className="mx-auto h-auto w-full max-w-[280px]"
            priority
          />
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            Sign in to log study sessions, track homework, and review progress.
          </p>
        </div>
        {authFailed && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
            Sign-in could not be completed. Please try again. If this keeps
            happening, ask your tutor to verify Supabase redirect URLs include{" "}
            <span className="font-medium">/auth/callback</span> for this site.
          </p>
        )}
        <GoogleSignInButton />
        <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
          A calm space for consistent, accountable learning.
        </p>
      </div>
    </div>
  );
}
