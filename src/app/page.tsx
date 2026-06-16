import Image from "next/image";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const features = [
  {
    title: "For students",
    description:
      "Log daily study sessions, submit homework, track lessons learned, and message your tutor in one calm workspace.",
  },
  {
    title: "For parents",
    description:
      "See linked students' progress, homework status, and study consistency without needing to manage the details yourself.",
  },
  {
    title: "For tutors",
    description:
      "Review submissions, leave feedback, manage students and parents, and keep everyone accountable between sessions.",
  },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const authFailed = params.error === "auth";

  return (
    <div className="flex-1">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-12 text-center">
          <Image
            src="/tutorcheck-logo.png"
            alt="TutorCheck"
            width={320}
            height={82}
            className="mx-auto h-auto w-full max-w-[320px]"
            priority
          />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">
            Tutoring accountability, made simple
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-muted)] sm:text-lg">
            TutorCheck is a free tutoring companion that helps students stay
            consistent between sessions, gives parents clear visibility into
            progress, and gives tutors one place to review work and communicate.
          </p>
        </header>

        <section className="mb-12 grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-800">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                {feature.description}
              </p>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-sm">
          <h2 className="text-center text-xl font-semibold text-slate-800">
            Sign in to TutorCheck
          </h2>
          <p className="mt-2 text-center text-sm text-[var(--color-muted)]">
            Use the Google account your tutor invited you with. New users choose
            whether they are a student or parent after signing in.
          </p>
          {authFailed && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
              Sign-in could not be completed. Please try again. If this keeps
              happening, ask your tutor to verify Supabase redirect URLs include{" "}
              <span className="font-medium">/auth/callback</span> for this site.
            </p>
          )}
          <div className="mt-6">
            <GoogleSignInButton />
          </div>
          <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
            TutorCheck is free, non-commercial, and does not sell your data.
          </p>
        </section>
      </div>
    </div>
  );
}
