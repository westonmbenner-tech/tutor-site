import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardCard, StatCard } from "@/components/DashboardCard";
import { StreakProgress } from "@/components/StreakProgress";
import { HomeworkList } from "@/components/HomeworkList";
import { MistakeList } from "@/components/MistakeList";
import { AccuracyTrendChart, SimpleTrendChart } from "@/components/AccuracyTrendChart";
import {
  TutorCommentBox,
  TutorCommentList,
} from "@/components/TutorCommentBox";
import { AISummaryPanel } from "@/components/AISummaryPanel";
import {
  AdminStudentTools,
  LinkParentForm,
} from "@/components/admin/AdminStudentTools";
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

  return (
    <AppShell role="admin" userName={profile.full_name ?? "Tutor"}>
      <div className="mb-6">
        <Link
          href="/admin/students"
          className="text-sm text-[var(--color-accent)]"
        >
          ← Back to students
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-800">
          {bundle.student.display_name}
        </h1>
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
          label="Avg confidence"
          value={bundle.stats.avgConfidence?.toFixed(1) ?? "—"}
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
              {bundle.studyLogs.slice(0, 10).map((log) => (
                <li
                  key={log.id}
                  className="rounded-lg border border-[var(--color-border)] p-3 text-sm"
                >
                  <p className="font-medium text-slate-800">{log.log_date}</p>
                  <p className="text-[var(--color-muted)]">
                    {log.questions_completed} questions · {log.topic ?? "No topic"}
                  </p>
                  <div className="mt-2">
                    <TutorCommentBox studentId={studentId} studyLogId={log.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard title="Homework">
          <HomeworkList items={bundle.homework} />
        </DashboardCard>

        <DashboardCard title="Mistakes">
          <MistakeList mistakes={bundle.mistakes.slice(0, 15)} />
        </DashboardCard>

        <DashboardCard title="Mistake labels">
          {bundle.labels.length === 0 ? (
            <div className="empty-state">No labels yet.</div>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {bundle.labels.map((l) => (
                <li
                  key={l.id}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                >
                  {l.name}
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard title="AI summaries">
          <AISummaryPanel
            studentId={studentId}
            summaries={bundle.aiSummaries}
          />
        </DashboardCard>

        <DashboardCard title="Tutor comments">
          <TutorCommentList comments={bundle.comments} />
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
      </div>
    </AppShell>
  );
}
