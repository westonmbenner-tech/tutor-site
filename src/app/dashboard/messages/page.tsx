import { RoleAppShell } from "@/components/layout/RoleAppShell";
import { DashboardCard } from "@/components/DashboardCard";
import { MessageThread } from "@/components/messages/MessageThread";
import { requireStudent, getStudentForProfile } from "@/lib/auth";
import { fetchMessages } from "@/lib/data";

export default async function StudentMessagesPage() {
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

  const messages = await fetchMessages(student.id);

  return (
    <RoleAppShell profile={profile} userName={profile.full_name ?? student.display_name}>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">Messages</h1>
      <DashboardCard title="Family & tutor chat">
        <MessageThread
          studentId={student.id}
          studentName={student.display_name}
          messages={messages}
          currentUserId={profile.id}
        />
      </DashboardCard>
    </RoleAppShell>
  );
}
