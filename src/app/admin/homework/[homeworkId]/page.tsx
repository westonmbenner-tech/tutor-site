import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardCard } from "@/components/DashboardCard";
import { HomeworkAssignmentDetail } from "@/components/admin/AdminHomeworkSubmissions";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolveHomeworkStatuses } from "@/lib/streak";
import type { HomeworkAssignment, TutorComment } from "@/lib/types";

export default async function AdminHomeworkDetailPage({
  params,
}: {
  params: Promise<{ homeworkId: string }>;
}) {
  const profile = await requireAdmin();
  const { homeworkId } = await params;
  const supabase = await createClient();

  const [{ data: homework }, { data: comments }] = await Promise.all([
    supabase
      .from("homework_assignments")
      .select("*, students(display_name)")
      .eq("id", homeworkId)
      .maybeSingle(),
    supabase
      .from("tutor_comments")
      .select("*, profiles(full_name, role)")
      .eq("homework_assignment_id", homeworkId)
      .order("created_at", { ascending: true }),
  ]);

  if (!homework) notFound();

  const resolved = resolveHomeworkStatuses([homework as HomeworkAssignment])[0];
  const studentName =
    (homework as HomeworkAssignment & { students?: { display_name: string } })
      .students?.display_name ?? "Student";

  return (
    <AppShell role="admin" userName={profile.full_name ?? "Tutor"}>
      <div className="mb-6">
        <Link
          href="/admin/homework"
          className="text-sm text-[var(--color-accent)]"
        >
          ← Back to homework
        </Link>
      </div>
      <DashboardCard title="Assignment review">
        <HomeworkAssignmentDetail
          item={resolved}
          studentName={studentName}
          comments={(comments ?? []) as TutorComment[]}
          currentUserId={profile.id}
        />
      </DashboardCard>
    </AppShell>
  );
}
