import { RoleAppShell } from "@/components/layout/RoleAppShell";
import { OverviewNotificationBanner } from "@/components/OverviewNotificationBanner";
import { DashboardCard, StatCard } from "@/components/DashboardCard";
import { StreakProgress } from "@/components/StreakProgress";
import { HomeworkList } from "@/components/HomeworkList";
import { AccuracyTrendChart } from "@/components/AccuracyTrendChart";
import { MistakesExplorer } from "@/components/mistakes/MistakesExplorer";
import { TutorCommentList } from "@/components/TutorCommentBox";
import { requireParent, getParentForProfile } from "@/lib/auth";
import { fetchParentStudents } from "@/lib/data";
import { getNotificationSummary } from "@/lib/notifications";

export default async function ParentDashboardPage() {
  const profile = await requireParent();
  const parent = await getParentForProfile(profile.id);

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
  const notifications = await getNotificationSummary(profile);

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

  return (
    <RoleAppShell
      profile={profile}
      userName={profile.full_name ?? "Parent"}
      notifications={notifications}
    >
      <OverviewNotificationBanner
        notifications={notifications}
        messagesHref="/parent/messages"
        commentsHref="/parent#tutor-comments"
      />
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">
        Student progress
      </h1>
      <div className="space-y-8">
        {bundles.map((bundle, index) => {
          const parentComments = bundle.comments.filter(
            (c) => c.visible_to_parent
          );
          const homework = bundle.homework;

          return (
            <section key={bundle.student.id}>
              <h2 className="mb-4 text-xl font-semibold text-slate-800">
                {bundle.student.display_name}
              </h2>
              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                <StatCard
                  label="Questions completed"
                  value={bundle.stats.totalQuestionsCompleted}
                />
                <StatCard
                  label="Accuracy"
                  value={`${bundle.stats.accuracyPercent ?? "—"}%`}
                />
                <StatCard
                  label="Weekly streak"
                  value={`${bundle.streakCount} week(s)`}
                />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <DashboardCard title="Weekly study progress">
                  <StreakProgress
                    progress={bundle.progress}
                    streakCount={bundle.streakCount}
                    calendarLogs={bundle.studyLogs}
                    calendarHomework={bundle.homework}
                    calendarFreezes={bundle.freezes}
                  />
                </DashboardCard>
                <DashboardCard title="Accuracy trend">
                  <AccuracyTrendChart data={bundle.accuracyTrend} />
                </DashboardCard>
                <DashboardCard title="Homework">
                  <HomeworkList
                    items={homework}
                    comments={bundle.comments}
                    studentId={bundle.student.id}
                    currentUserId={profile.id}
                    replyAs="parent"
                  />
                </DashboardCard>
                <DashboardCard
                  id={index === 0 ? "tutor-comments" : undefined}
                  title="Tutor comments"
                >
                  <TutorCommentList
                    comments={parentComments}
                    studentId={bundle.student.id}
                    currentUserId={profile.id}
                    replyAs="parent"
                  />
                </DashboardCard>
                <DashboardCard title="Mistakes" className="lg:col-span-2">
                  <MistakesExplorer
                    mistakes={bundle.mistakes}
                    labels={bundle.labels}
                    studentName={bundle.student.display_name}
                    showLessonsColumn
                  />
                </DashboardCard>
              </div>
            </section>
          );
        })}
      </div>
    </RoleAppShell>
  );
}
