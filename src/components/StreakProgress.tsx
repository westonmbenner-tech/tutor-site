import type { WeeklyProgress } from "@/lib/types";
import { buildStudyCalendar } from "@/lib/streak";
import type { HomeworkAssignment, StreakFreeze, StudyLog } from "@/lib/types";

interface StreakProgressProps {
  progress: WeeklyProgress;
  streakCount: number;
  calendarLogs: Pick<StudyLog, "log_date">[];
  calendarHomework: Pick<HomeworkAssignment, "completed_at">[];
  calendarFreezes: Pick<StreakFreeze, "freeze_date">[];
  freezesRemaining?: number;
}

function activitySummary(progress: WeeklyProgress): string {
  const parts: string[] = [];

  if (progress.studyLogDays > 0) {
    parts.push(`${progress.studyLogDays} study log${progress.studyLogDays === 1 ? "" : "s"}`);
  }

  if (progress.homeworkDays > 0) {
    parts.push(
      `${progress.homeworkDays} homework day${progress.homeworkDays === 1 ? "" : "s"}`
    );
  }

  if (progress.freezeDays > 0) {
    parts.push(`${progress.freezeDays} excused`);
  }

  return parts.length > 0 ? parts.join(" · ") : "No activity yet";
}

export function StreakProgress({
  progress,
  streakCount,
  calendarLogs,
  calendarHomework,
  calendarFreezes,
  freezesRemaining,
}: StreakProgressProps) {
  const calendar = buildStudyCalendar(
    calendarLogs,
    calendarFreezes,
    calendarHomework,
    14
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-[var(--color-primary-light)]/50 p-4">
          <p className="text-sm text-[var(--color-muted)]">This week</p>
          <p className="mt-1 text-xl font-semibold text-[var(--color-primary)]">
            {progress.effectiveDays} / {progress.targetDays} activity days
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {activitySummary(progress)}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-sm text-[var(--color-muted)]">Weekly streak</p>
          <p className="mt-1 text-xl font-semibold text-slate-800">
            {streakCount} {streakCount === 1 ? "week" : "weeks"}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            5 of 7 days with a study log or homework submission (freezes count)
            {freezesRemaining !== undefined
              ? ` · ${freezesRemaining} freeze${freezesRemaining === 1 ? "" : "s"} left`
              : ""}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Recent activity</p>
        <div className="flex flex-wrap gap-2">
          {calendar.map((day) => {
            const hasActivity = day.hasStudyLog || day.hasHomework;
            const title = [
              day.date,
              day.hasStudyLog ? "Study log" : null,
              day.hasHomework ? "Homework submitted" : null,
              day.hasFreeze ? "Streak freeze" : null,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <div
                key={day.date}
                title={title}
                className={`flex h-9 w-9 items-center justify-center rounded-md text-xs font-medium ${
                  hasActivity
                    ? day.hasStudyLog && day.hasHomework
                      ? "bg-[var(--color-primary)] text-white ring-2 ring-[var(--color-accent)] ring-offset-1"
                      : "bg-[var(--color-primary)] text-white"
                    : day.hasFreeze
                      ? "border-2 border-dashed border-[var(--color-accent)] bg-blue-50 text-[var(--color-accent)]"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {day.date.slice(-2)}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          Solid = study log or homework · Ring = both · Dashed = streak freeze
        </p>
      </div>
    </div>
  );
}
