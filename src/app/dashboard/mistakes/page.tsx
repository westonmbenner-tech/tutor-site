import { AppShell } from "@/components/layout/AppShell";
import { DashboardCard } from "@/components/DashboardCard";
import { MistakeForm } from "@/components/MistakeForm";
import { MistakeList } from "@/components/MistakeList";
import { requireStudent, getStudentForProfile } from "@/lib/auth";
import { fetchStudentBundle } from "@/lib/data";

export default async function StudentMistakesPage() {
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

  return (
    <AppShell role="student" userName={profile.full_name ?? student.display_name}>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">Mistakes</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Add a mistake">
          <MistakeForm studentId={student.id} labels={bundle.labels} />
        </DashboardCard>
        <DashboardCard title="All mistakes">
          <MistakeList mistakes={bundle.mistakes} />
        </DashboardCard>
      </div>
    </AppShell>
  );
}
