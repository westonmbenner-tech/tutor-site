import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardCard } from "@/components/DashboardCard";
import { MessageThread } from "@/components/messages/MessageThread";
import { requireAdmin } from "@/lib/auth";
import { fetchMessages, fetchStudentBundle } from "@/lib/data";

export default async function AdminStudentMessagesPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const profile = await requireAdmin();
  const { studentId } = await params;
  const bundle = await fetchStudentBundle(studentId);

  if (!bundle.student) notFound();

  const messages = await fetchMessages(studentId);

  return (
    <AppShell role="admin" userName={profile.full_name ?? "Tutor"}>
      <div className="mb-6">
        <Link
          href="/admin/messages"
          className="text-sm text-[var(--color-accent)]"
        >
          ← All conversations
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-800">
          Messages · {bundle.student.display_name}
        </h1>
      </div>
      <DashboardCard title="Family & tutor chat">
        <MessageThread
          studentId={studentId}
          studentName={bundle.student.display_name}
          messages={messages}
          currentUserId={profile.id}
        />
      </DashboardCard>
    </AppShell>
  );
}
