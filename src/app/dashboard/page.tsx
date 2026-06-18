import { AppShell } from "@/components/layout/AppShell";
import { DashboardCard, StatCard } from "@/components/DashboardCard";
import { StreakProgress } from "@/components/StreakProgress";
import { StudyLogForm } from "@/components/StudyLogForm";
import { HomeworkList } from "@/components/HomeworkList";
import { CollapsibleMistakeForm } from "@/components/CollapsibleMistakeForm";
import { LessonsLearnedByTag } from "@/components/LessonsLearnedByTag";
import { UseStreakFreezeForm } from "@/components/UseStreakFreezeForm";
import { TutorCommentList } from "@/components/TutorCommentBox";
import { requireStudent, getStudentForProfile } from "@/lib/auth";
import { fetchStudentBundle } from "@/lib/data";
import { formatDateISO } from "@/lib/streak";
import { format } from "date-fns";
import Link from "next/link";

export default async function StudentDashboardPage() {
  const profile = await requireStudent();
  const student = await getStudentForProfile(profile.id);

  if (!student) {
    return (
      <AppShell role="student" userName={profile.full_name ?? "Student"}>
        <DashboardCard title="Account setup pending">
          <p className="text-sm text-[var(--color-muted)]">
            Your tutor has not linked your account to a student profile yet.
            Please contact them after signing in.
          </p>
        </DashboardCard>
      </AppShell>
    );
  }

  const bundle = await fetchStudentBundle(student.id);
  const today = format(new Date(), "EEEE, MMMM d, yyyy");
  const dueSoon = bundle.homework.filter(
    (h) => h.resolved_status === "assigned"
  );
  const overdue = bundle.homework.filter(
    (h) => h.resolved_status === "missing" || h.resolved_status === "late"
  );
  const studentComments = bundle.comments.filter((c) => c.visible_to_student);
  const wrongCount = bundle.todayLog?.questions_wrong ?? 0;

  return (
    <AppShell role="student" userName={profile.full_name ?? student.display_name}>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-800">Today</h1>
        <p className="mt-1 text-[var(--color-muted)]">{today}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DashboardCard title="Weekly progress">
            <StreakProgress
              progress={bundle.progress}
              streakCount={bundle.streakCount}
              calendarLogs={bundle.studyLogs}
              calendarFreezes={bundle.freezes}
              freezesRemaining={student.streak_freeze_balance}
            />
            <div className="mt-4">
              <UseStreakFreezeForm
                studentId={student.id}
                balance={student.streak_freeze_balance}
              />
            </div>
          </DashboardCard>

          <DashboardCard
            title="Today's study log"
            subtitle="Logging counts toward your weekly streak — not question count."
          >
            <StudyLogForm
              studentId={student.id}
              defaultDate={formatDateISO(new Date())}
              existingLog={bundle.todayLog}
            />
          </DashboardCard>

          <DashboardCard
            title={
              wrongCount > 0
                ? `Record ${wrongCount} mistake${wrongCount === 1 ? "" : "s"}`
                : "Record mistakes"
            }
          >
            <CollapsibleMistakeForm
              studentId={student.id}
              labels={bundle.labels}
              studyLogId={bundle.todayLog?.id}
              wrongCount={wrongCount}
            />
          </DashboardCard>
        </div>

        <div className="space-y-6">
          <DashboardCard
            title="Homework due soon"
            action={
              <Link href="/dashboard/homework" className="text-sm text-[var(--color-accent)]">
                View all
              </Link>
            }
          >
            <HomeworkList items={dueSoon.slice(0, 5)} showCompleteButton />
          </DashboardCard>

          {overdue.length > 0 && (
            <DashboardCard title="Late / missing">
              <HomeworkList items={overdue} showCompleteButton />
            </DashboardCard>
          )}

          <DashboardCard
            title="Lessons learned"
            action={
              <Link
                href="/dashboard/mistakes"
                className="text-sm text-[var(--color-accent)]"
              >
                View all mistakes
              </Link>
            }
          >
            <LessonsLearnedByTag mistakes={bundle.mistakes.slice(0, 8)} />
          </DashboardCard>

          <DashboardCard title="Tutor comments">
            <TutorCommentList
              comments={studentComments}
              studentId={student.id}
              currentUserId={profile.id}
              replyAs="student"
            />
          </DashboardCard>
        </div>
      </div>
    </AppShell>
  );
}
