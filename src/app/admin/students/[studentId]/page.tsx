import { notFound } from "next/navigation";
import Link from "next/link";
import { RoleAppShell } from "@/components/layout/RoleAppShell";
import { DashboardCard, StatCard } from "@/components/DashboardCard";
import { StreakProgress } from "@/components/StreakProgress";
import { AdminHomeworkSubmissions } from "@/components/admin/AdminHomeworkSubmissions";
import { StudyLogAdminEntry } from "@/components/admin/StudyLogAdminEntry";
import { MistakesExplorer } from "@/components/mistakes/MistakesExplorer";
import { AdminMistakeLabelsPanel } from "@/components/admin/AdminMistakeLabelsPanel";
import { AccuracyTrendChart, SimpleTrendChart } from "@/components/AccuracyTrendChart";
import {
  TutorCommentList,
} from "@/components/TutorCommentBox";
import { AISummaryPanel } from "@/components/AISummaryPanel";
import {
  AdminStudentTools,
  LinkParentForm,
} from "@/components/admin/AdminStudentTools";
import { RemoveStudentPanel } from "@/components/admin/RemoveStudentPanel";
import { StudentLoginHistory } from "@/components/admin/StudentLoginHistory";
import { requireAdmin } from "@/lib/auth";
import { fetchStudentBundle } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import {
  buildConfidenceTrend,
  buildQuestionsTrend,
} from "@/lib/analytics";

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const profile = await requireAdmin();
  const { studentId } = await params;
  const bundle = await fetchStudentBundle(studentId);

  if (!bundle.student) notFound();

  const supabase = await createClient();
  const { data: parents } = await supabase
    .from("parents")
    .select("*")
    .order("display_name");

  const { data: links } = await supabase
    .from("parent_student_links")
    .select("*, parents(display_name)")
    .eq("student_id", studentId);

  let studentLoginHistory: unknown = [];
  if (bundle.student.profile_id) {
    const { data: studentProfile } = await supabase
      .from("profiles")
      .select("login_history")
      .eq("id", bundle.student.profile_id)
      .maybeSingle();

    studentLoginHistory = studentProfile?.login_history ?? [];
  }

  return (
    <RoleAppShell profile={profile} userName={profile.full_name ?? "Tutor"}>
      <div className="mb-6">
        <Link
          href="/admin/students"
          className="text-sm text-[var(--color-accent)]"
        >
          ← Back to students
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <h1 className="text-2xl font-semibold text-slate-800">
            {bundle.student.display_name}
          </h1>
          <Link
            href={`/admin/messages/${studentId}`}
            className="text-sm font-medium text-[var(--color-primary)]"
          >
            Messages
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard
          label="Questions completed"
          value={bundle.stats.totalQuestionsCompleted}
        />
        <StatCard
          label="Accuracy"
          value={`${bundle.stats.accuracyPercent ?? "—"}%`}
        />
        <StatCard
          label="Wrong answers"
          value={bundle.stats.totalQuestionsWrong}
        />
        <StatCard
          label="Streak freezes left"
          value={bundle.student.streak_freeze_balance}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Weekly progress">
          <StreakProgress
            progress={bundle.progress}
            streakCount={bundle.streakCount}
            calendarLogs={bundle.studyLogs}
            calendarFreezes={bundle.freezes}
          />
        </DashboardCard>

        <DashboardCard title="Accuracy trend">
          <AccuracyTrendChart data={bundle.accuracyTrend} />
        </DashboardCard>

        <DashboardCard title="Questions over time">
          <SimpleTrendChart
            data={buildQuestionsTrend(bundle.studyLogs)}
            label="Questions"
          />
        </DashboardCard>

        <DashboardCard title="Confidence trend">
          <SimpleTrendChart
            data={buildConfidenceTrend(bundle.studyLogs)}
            label="Confidence"
            domain={[1, 5]}
          />
        </DashboardCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Recent study logs">
          {bundle.studyLogs.length === 0 ? (
            <div className="empty-state">No logs yet.</div>
          ) : (
            <ul className="space-y-3">
              {bundle.studyLogs.slice(0, 10).map((log) => {
                const logComments = bundle.comments.filter(
                  (comment) => comment.study_log_id === log.id
                );

                return (
                  <StudyLogAdminEntry key={log.id} log={log}>
                    <TutorCommentList
                      comments={logComments}
                      studentId={studentId}
                      currentUserId={profile.id}
                      replyAs="admin"
                      showTopLevelComposer={logComments.length === 0}
                      studyLogId={log.id}
                    />
                  </StudyLogAdminEntry>
                );
              })}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard title="Homework submissions">
          <AdminHomeworkSubmissions
            items={bundle.homework}
            comments={bundle.comments}
          />
        </DashboardCard>

        <DashboardCard title="Mistakes" className="lg:col-span-2">
          <AdminMistakeLabelsPanel
            studentId={studentId}
            labels={bundle.labels}
            mistakes={bundle.mistakes}
          />
          <MistakesExplorer
            mistakes={bundle.mistakes}
            labels={bundle.labels}
            studentName={bundle.student.display_name}
          />
        </DashboardCard>

        <DashboardCard title="AI summaries">
          <AISummaryPanel
            studentId={studentId}
            summaries={bundle.aiSummaries}
          />
        </DashboardCard>

        <DashboardCard title="Recent sign-ins">
          <StudentLoginHistory loginHistory={studentLoginHistory} />
        </DashboardCard>

        <DashboardCard title="Parent links">
          {links?.length ? (
            <ul className="mb-4 space-y-1 text-sm">
              {links.map((l) => (
                <li key={l.id}>
                  {(l.parents as { display_name: string }).display_name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 text-sm text-[var(--color-muted)]">
              No parents linked.
            </p>
          )}
          <LinkParentForm
            studentId={studentId}
            parents={(parents ?? []) as import("@/lib/types").Parent[]}
          />
        </DashboardCard>

        <DashboardCard title="Admin tools" className="lg:col-span-2">
          <AdminStudentTools
            studentId={studentId}
            studentName={bundle.student.display_name}
            parents={(parents ?? []) as import("@/lib/types").Parent[]}
          />
        </DashboardCard>

        <DashboardCard title="Remove student" className="lg:col-span-2">
          <p className="mb-4 text-sm text-[var(--color-muted)]">
            Permanently delete this student and all associated progress data.
          </p>
          <RemoveStudentPanel
            studentId={studentId}
            studentName={bundle.student.display_name}
          />
        </DashboardCard>
      </div>
    </RoleAppShell>
  );
}
