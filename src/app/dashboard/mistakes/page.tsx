import { RoleAppShell } from "@/components/layout/RoleAppShell";
import { DashboardCard } from "@/components/DashboardCard";
import { CollapsibleMistakeForm } from "@/components/CollapsibleMistakeForm";
import { MistakesExplorer } from "@/components/mistakes/MistakesExplorer";
import { requireStudent, getStudentForProfile } from "@/lib/auth";
import { fetchStudentBundle } from "@/lib/data";

export default async function StudentLessonsLearnedPage() {
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
  const wrongCount = bundle.todayLog?.questions_wrong ?? 0;

  return (
    <RoleAppShell profile={profile} userName={profile.full_name ?? student.display_name}>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">
        Lessons learned
      </h1>

      <DashboardCard className="mb-6" title="Add a mistake">
        <CollapsibleMistakeForm
          studentId={student.id}
          labels={bundle.labels}
          studyLogId={bundle.todayLog?.id}
          wrongCount={wrongCount}
        />
      </DashboardCard>

      <DashboardCard title="Mistakes">
        <MistakesExplorer
          mistakes={bundle.mistakes}
          labels={bundle.labels}
          studentName={student.display_name}
          showLessonsColumn
        />
      </DashboardCard>
    </RoleAppShell>
  );
}
