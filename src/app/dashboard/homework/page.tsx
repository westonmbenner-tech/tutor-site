import { RoleAppShell } from "@/components/layout/RoleAppShell";
import { DashboardCard } from "@/components/DashboardCard";
import { HomeworkList } from "@/components/HomeworkList";
import { requireStudent, getStudentForProfile } from "@/lib/auth";
import { fetchStudentBundle } from "@/lib/data";

export default async function StudentHomeworkPage() {
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
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">Homework</h1>
      <DashboardCard title="All assignments">
        <HomeworkList items={bundle.homework} showCompleteButton />
      </DashboardCard>
    </RoleAppShell>
  );
}
