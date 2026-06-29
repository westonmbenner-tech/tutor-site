import Link from "next/link";
import { RoleAppShell } from "@/components/layout/RoleAppShell";
import { DashboardCard } from "@/components/DashboardCard";
import { AISummaryPanel } from "@/components/AISummaryPanel";
import { requireParent, getParentForProfile } from "@/lib/auth";
import { fetchParentStudents } from "@/lib/data";

export default async function ParentAISummaryPage() {
  const profile = await requireParent();
  const parent = await getParentForProfile(profile.id);

  if (!parent) {
    return (
      <RoleAppShell profile={profile} userName={profile.full_name ?? "Parent"}>
        <DashboardCard title="Account setup pending">
          <p className="text-sm text-[var(--color-muted)]">
            Your tutor has not approved your parent account yet.
          </p>
        </DashboardCard>
      </RoleAppShell>
    );
  }

  const bundles = await fetchParentStudents(profile.id);

  if (bundles.length === 0) {
    return (
      <RoleAppShell profile={profile} userName={profile.full_name ?? "Parent"}>
        <DashboardCard title="No linked students">
          <p className="text-sm text-[var(--color-muted)]">
            Your tutor has not linked any student accounts to your profile yet.
          </p>
        </DashboardCard>
      </RoleAppShell>
    );
  }

  return (
    <RoleAppShell profile={profile} userName={profile.full_name ?? "Parent"}>
      <h1 className="mb-2 text-2xl font-semibold text-slate-800">AI Insights</h1>
      <p className="mb-6 text-sm text-[var(--color-muted)]">
        Run mistake pattern analysis for your linked students — the same AI tutor
        tool students use to spot weak areas and next steps.
      </p>

      <div className="space-y-8">
        {bundles.map((bundle) => (
          <section key={bundle.student.id}>
            <h2 className="mb-4 text-xl font-semibold text-slate-800">
              {bundle.student.display_name}
            </h2>
            <DashboardCard title="Mistake pattern analysis">
              <AISummaryPanel
                studentId={bundle.student.id}
                summaries={bundle.aiSummaries}
              />
            </DashboardCard>
          </section>
        ))}
      </div>

      <p className="mt-6 text-sm text-[var(--color-muted)]">
        <Link href="/parent" className="text-[var(--color-accent)] hover:underline">
          ← Back to overview
        </Link>
      </p>
    </RoleAppShell>
  );
}
