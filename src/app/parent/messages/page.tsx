import { RoleAppShell } from "@/components/layout/RoleAppShell";
import { DashboardCard } from "@/components/DashboardCard";
import { MessageThread } from "@/components/messages/MessageThread";
import { StudentThreadPicker } from "@/components/messages/StudentThreadPicker";
import { requireParent, getParentForProfile } from "@/lib/auth";
import { fetchMessages, fetchParentStudents } from "@/lib/data";

export default async function ParentMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const profile = await requireParent();
  const parent = await getParentForProfile(profile.id);
  const params = await searchParams;

  if (!parent) {
    return (
      <RoleAppShell profile={profile} userName={profile.full_name ?? "Parent"}>
        <DashboardCard title="Account setup pending">
          <p className="text-sm text-[var(--color-muted)]">
            Your tutor has not approved your parent account yet. Please contact
            them after signing in.
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

  const students = bundles.map((bundle) => bundle.student);
  const activeStudentId =
    students.find((student) => student.id === params.student)?.id ??
    students[0].id;
  const activeStudent = students.find((student) => student.id === activeStudentId)!;
  const messages = await fetchMessages(activeStudentId);

  return (
    <RoleAppShell profile={profile} userName={profile.full_name ?? "Parent"}>
      <h1 className="mb-2 text-2xl font-semibold text-slate-800">Messages</h1>
      <StudentThreadPicker
        students={students}
        activeStudentId={activeStudentId}
        basePath="/parent/messages"
      />
      <DashboardCard title={`Chat about ${activeStudent.display_name}`}>
        <MessageThread
          studentId={activeStudentId}
          studentName={activeStudent.display_name}
          messages={messages}
          currentUserId={profile.id}
        />
      </DashboardCard>
    </RoleAppShell>
  );
}
