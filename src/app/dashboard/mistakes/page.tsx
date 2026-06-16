import { AppShell } from "@/components/layout/AppShell";
import { DashboardCard } from "@/components/DashboardCard";
import { CollapsibleMistakeForm } from "@/components/CollapsibleMistakeForm";
import { MistakeList } from "@/components/MistakeList";
import { LessonsLearnedByTag } from "@/components/LessonsLearnedByTag";
import { requireStudent, getStudentForProfile } from "@/lib/auth";
import { fetchStudentBundle } from "@/lib/data";

export default async function StudentLessonsLearnedPage() {
  const profile = await requireStudent();
  const student = await getStudentForProfile(profile.id);

  if (!student) {
    return (
      <AppShell role="student" userName={profile.full_name ?? "Student"}>
        <DashboardCard title="Account setup pending">
          <p className="text-sm text-[var(--color-muted)]">
            Contact your tutor to finish account setup.
          </p>
        </DashboardCard>
      </AppShell>
    );
  }

  const bundle = await fetchStudentBundle(student.id);
  const wrongCount = bundle.todayLog?.questions_wrong ?? 0;

  return (
    <AppShell role="student" userName={profile.full_name ?? student.display_name}>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="All mistakes">
          <MistakeList mistakes={bundle.mistakes} />
        </DashboardCard>
        <DashboardCard title="Lessons learned">
          <LessonsLearnedByTag mistakes={bundle.mistakes} />
        </DashboardCard>
      </div>
    </AppShell>
  );
}
