import type { WeeklyProgress } from "@/lib/types";
import { buildStudyCalendar } from "@/lib/streak";
import type { StreakFreeze, StudyLog } from "@/lib/types";

interface StreakProgressProps {
  progress: WeeklyProgress;
  streakCount: number;
  calendarLogs: Pick<StudyLog, "log_date">[];
  calendarFreezes: Pick<StreakFreeze, "freeze_date">[];
}

export function StreakProgress({
  progress,
  streakCount,
  calendarLogs,
  calendarFreezes,
}: StreakProgressProps) {
  const calendar = buildStudyCalendar(calendarLogs, calendarFreezes, 14);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-[var(--color-primary-light)]/50 p-4">
          <p className="text-sm text-[var(--color-muted)]">This week</p>
          <p className="mt-1 text-xl font-semibold text-[var(--color-primary)]">
            {progress.effectiveDays} / {progress.targetDays} study days
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {progress.studyDays} logged
            {progress.freezeDays > 0
              ? ` · ${progress.freezeDays} excused`
              : ""}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-sm text-[var(--color-muted)]">Weekly streak</p>
          <p className="mt-1 text-xl font-semibold text-slate-800">
            {streakCount} {streakCount === 1 ? "week" : "weeks"}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            5 of 7 days with a log (freezes count)
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Recent activity</p>
        <div className="flex flex-wrap gap-2">
          {calendar.map((day) => (
            <div
              key={day.date}
              title={day.date}
              className={`flex h-9 w-9 items-center justify-center rounded-md text-xs font-medium ${
                day.hasLog
                  ? "bg-[var(--color-primary)] text-white"
                  : day.hasFreeze
                    ? "border-2 border-dashed border-[var(--color-accent)] bg-blue-50 text-[var(--color-accent)]"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {day.date.slice(-2)}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          Solid = study log · Dashed = streak freeze
        </p>
      </div>
    </div>
  );
}
