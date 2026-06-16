import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy — TutorCheck",
  description: "How TutorCheck handles account and tutoring data.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy">
      <p>
        <strong>Last updated:</strong> June 2026
      </p>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-800">Overview</h2>
        <p>
          TutorCheck is a free tutoring accountability tool. It is not a
          commercial product: we do not charge fees, run advertisements, sell
          data, or use your information for marketing.
        </p>
        <p>
          Information entered here exists only to support study tracking between
          students, parents, and a tutor.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-800">
          What we collect
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Sign-in details</strong> — When you sign in with Google, we
            receive basic account information (such as your name and email) to
            create and secure your profile.
          </li>
          <li>
            <strong>Study and tutoring content</strong> — Logs, homework,
            mistakes, messages, comments, and related progress data that you or
            your tutor enter in the portal.
          </li>
          <li>
            <strong>Technical data</strong> — Standard server and security logs
            needed to operate the site (for example, error diagnostics).
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-800">How we use it</h2>
        <p>Data is used only to operate the portal:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Authenticate you and keep your session secure</li>
          <li>Display progress to authorized students, parents, and the tutor</li>
          <li>Support homework, messaging, and accountability features</li>
          <li>Optionally generate AI study summaries when that feature is used</li>
        </ul>
        <p>
          We do <strong>not</strong> sell, rent, or trade personal data. We do
          not use it for advertising or to build marketing profiles.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-800">Who can see it</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Students</strong> see their own study data and shared tutor
            feedback.
          </li>
          <li>
            <strong>Parents</strong> see progress for students linked to their
            account by the tutor.
          </li>
          <li>
            <strong>The tutor (admin)</strong> can view and manage data for
            students in the program.
          </li>
        </ul>
        <p>
          Access is enforced by account roles and database security rules. Users
          outside these relationships cannot view your data.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-800">
          Third-party services
        </h2>
        <p>The site relies on trusted infrastructure providers to run:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Google</strong> — sign-in (OAuth)
          </li>
          <li>
            <strong>Supabase</strong> — authentication and database hosting
          </li>
          <li>
            <strong>Vercel</strong> — application hosting
          </li>
          <li>
            <strong>OpenAI</strong> — optional AI summaries, only when that
            feature is used
          </li>
        </ul>
        <p>
          These providers process data only as needed to deliver the service.
          Their own privacy policies also apply.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-800">Retention</h2>
        <p>
          Data is kept while your account is active and needed for tutoring. The
          tutor may remove student or parent records when they are no longer
          part of the program.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-800">Your choices</h2>
        <p>
          To stop using the portal, sign out and contact your tutor to remove or
          unlink your account. Because this is a small tutoring program, direct
          requests to the tutor are the fastest way to handle access or deletion
          questions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-800">Contact</h2>
        <p>
          For privacy questions, contact the tutor who invited you to Study
          Portal.
        </p>
      </section>
    </LegalPageShell>
  );
}
