import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Terms of Service — TutorCheck",
  description: "Terms for using the TutorCheck tutoring site.",
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service">
      <p>
        <strong>Last updated:</strong> June 2026
      </p>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-800">Agreement</h2>
        <p>
          By signing in to or using TutorCheck, you agree to these terms. If
          you do not agree, do not use the site.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-800">What this is</h2>
        <p>
          TutorCheck is a free tool for tutoring accountability — daily study
          logs, homework tracking, progress review, and family/tutor messaging.
        </p>
        <p>
          <strong>There is no fee to use this site.</strong> No subscriptions,
          no payments, and no paid features are offered through TutorCheck.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-800">Eligibility</h2>
        <p>
          Access is by invitation through a tutor. Students and parents need
          tutor approval. Accounts are for personal educational use connected
          to that tutoring relationship.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-800">
          Acceptable use
        </h2>
        <p>You agree to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide accurate information when setting up your account</li>
          <li>Use the portal for legitimate study and communication purposes</li>
          <li>Respect other users in messages and shared spaces</li>
          <li>Keep your Google sign-in credentials secure</li>
        </ul>
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Attempt to access data you are not authorized to view</li>
          <li>Disrupt, scrape, or abuse the service</li>
          <li>Upload harmful, harassing, or unlawful content</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-800">
          Tutor administration
        </h2>
        <p>
          The tutor (admin) manages student and parent access, approves new
          sign-ups, and may remove accounts or data when appropriate. The tutor
          decides which parents are linked to which students.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-800">
          No commercial use
        </h2>
        <p>
          TutorCheck is not operated as a business. Data is not sold or used
          for advertising. The site exists solely to support tutoring — not to
          generate revenue from users.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-800">Disclaimer</h2>
        <p>
          The portal is provided &ldquo;as is&rdquo; for educational support. It
          is not a substitute for professional advice. AI-generated summaries,
          when shown, are informational only and may contain errors.
        </p>
        <p>
          We do not guarantee uninterrupted availability. Maintenance, outages,
          or third-party service issues may occasionally affect access.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-800">
          Limitation of liability
        </h2>
        <p>
          To the fullest extent permitted by law, TutorCheck and its operator
          are not liable for indirect or consequential damages arising from use
          of the site. Because the service is free, liability is limited
          accordingly.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-800">Changes</h2>
        <p>
          These terms may be updated from time to time. Continued use after
          changes are posted means you accept the revised terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-800">Contact</h2>
        <p>
          Questions about these terms should be directed to the tutor who
          operates your TutorCheck program.
        </p>
      </section>
    </LegalPageShell>
  );
}
