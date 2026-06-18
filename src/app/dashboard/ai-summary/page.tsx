import { RoleAppShell } from "@/components/layout/RoleAppShell";
import { DashboardCard } from "@/components/DashboardCard";
import { AISummaryPanel } from "@/components/AISummaryPanel";
import { requireStudent, getStudentForProfile } from "@/lib/auth";
import { fetchStudentBundle } from "@/lib/data";

export default async function StudentAISummaryPage() {
  const profile = await requireStudent();
  const student = await getStudentForProfile(profile.id);

  if (!student) {
    return (
      <RoleAppShell profile={profile} userName={profile.full_name ?? "Student"}>
        <DashboardCard title="Account setup pending">
          <p className="text-sm text-[var(--color-muted)]">
            Contact your tutor to finish account setup.
          </p>
        </DashboardCard>
      </RoleAppShell>
    );
  }

  const bundle = await fetchStudentBundle(student.id);

  return (
    <RoleAppShell profile={profile} userName={profile.full_name ?? student.display_name}>
      <h1 className="mb-2 text-2xl font-semibold text-slate-800">AI Insights</h1>
      <p className="mb-6 text-sm text-[var(--color-muted)]">
        Pattern analysis across your manually tagged mistakes.
      </p>
      <DashboardCard title="Mistake pattern analysis">
        <AISummaryPanel
          studentId={student.id}
          summaries={bundle.aiSummaries}
        />
      </DashboardCard>
    </RoleAppShell>
  );
}
