import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardCard, QuickLinksCard, StatCard } from "@/components/DashboardCard";
import { PendingStudentApprovals } from "@/components/admin/PendingStudentApprovals";
import { requireAdmin } from "@/lib/auth";
import {
  fetchAllStudentsOverview,
  fetchPendingProfiles,
} from "@/lib/data";

export default async function AdminDashboardPage() {
  const profile = await requireAdmin();
  const [overviews, pendingProfiles] = await Promise.all([
    fetchAllStudentsOverview(),
    fetchPendingProfiles(),
  ]);

  const needsAttention = overviews.filter((o) => o.attentionFlags.length > 0);

  return (
    <AppShell role="admin" userName={profile.full_name ?? "Tutor"}>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">
        Tutor overview
      </h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <StatCard
          label="Active students"
          value={overviews.length}
          href="#all-students"
          hint="Jump to student list"
        />
        <StatCard
          label="Pending approval"
          value={pendingProfiles.length}
          href={
            pendingProfiles.length > 0 ? "#pending-approval" : "/admin/students"
          }
          hint="Review sign-ups awaiting approval"
        />
        <StatCard
          label="Need attention"
          value={needsAttention.length}
          href={needsAttention.length > 0 ? "#needs-attention" : "#all-students"}
          hint="Students with flags or overdue work"
        />
        <QuickLinksCard
          links={[
            { label: "Students", href: "#all-students" },
            { label: "Homework", href: "/admin/homework#homework" },
            { label: "Parents", href: "/admin/parents#parents" },
          ]}
        />
      </div>

      {pendingProfiles.length > 0 && (
        <DashboardCard
          id="pending-approval"
          title="Users awaiting approval"
          subtitle="These users signed in with Google and are waiting for tutor approval."
          className="mb-6"
          action={
            <Link href="/admin/students" className="text-sm text-[var(--color-accent)]">
              Manage all →
            </Link>
          }
        >
          <PendingStudentApprovals profiles={pendingProfiles} />
        </DashboardCard>
      )}

      {needsAttention.length > 0 && (
        <DashboardCard id="needs-attention" title="Students needing attention" className="mb-6">
          <ul className="space-y-3">
            {needsAttention.map(({ student, attentionFlags }) => (
              <li
                key={student.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-amber-100 bg-amber-50/50 p-3"
              >
                <div>
                  <Link
                    href={`/admin/students/${student.id}`}
                    className="font-medium text-slate-800 hover:text-[var(--color-primary)]"
                  >
                    {student.display_name}
                  </Link>
                  <ul className="mt-1 text-sm text-[var(--color-warning)]">
                    {attentionFlags.map((f, i) => (
                      <li key={i}>{f.message}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </DashboardCard>
      )}

      <DashboardCard id="all-students" title="All students">
        {overviews.length === 0 ? (
          <div className="empty-state">
            No students yet.{" "}
            <Link href="/admin/students" className="text-[var(--color-accent)]">
              Add a student
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-muted)]">
                  <th className="pb-3 pr-4 font-medium">Student</th>
                  <th className="pb-3 pr-4 font-medium">Week</th>
                  <th className="pb-3 pr-4 font-medium">Streak</th>
                  <th className="pb-3 pr-4 font-medium">Accuracy</th>
                  <th className="pb-3 pr-4 font-medium">Questions</th>
                  <th className="pb-3 font-medium">Homework</th>
                </tr>
              </thead>
              <tbody>
                {overviews.map(
                  ({
                    student,
                    progress,
                    streakCount,
                    stats,
                    homeworkSummary,
                    commonLabels,
                  }) => (
                    <tr
                      key={student.id}
                      className="border-b border-[var(--color-border)] last:border-0"
                    >
                      <td className="py-3 pr-4">
                        <Link
                          href={`/admin/students/${student.id}`}
                          className="font-medium text-slate-800 hover:text-[var(--color-primary)]"
                        >
                          {student.display_name}
                        </Link>
                        {commonLabels.length > 0 && (
                          <p className="mt-1 text-xs text-[var(--color-muted)]">
                            Top labels:{" "}
                            {commonLabels.map((l) => l.name).join(", ")}
                          </p>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {progress.effectiveDays}/{progress.targetDays}
                      </td>
                      <td className="py-3 pr-4">{streakCount}w</td>
                      <td className="py-3 pr-4">
                        {stats.accuracyPercent ?? "—"}%
                      </td>
                      <td className="py-3 pr-4">
                        {stats.totalQuestionsCompleted} (
                        {stats.totalQuestionsWrong} wrong)
                      </td>
                      <td className="py-3">
                        {homeworkSummary.completed} done ·{" "}
                        {homeworkSummary.overdue} overdue
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </AppShell>
  );
}
