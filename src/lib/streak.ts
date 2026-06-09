import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  subWeeks,
  parseISO,
  isBefore,
  isAfter,
} from "date-fns";
import type { StreakFreeze, StudyLog, WeeklyProgress } from "./types";

const WEEK_OPTIONS = { weekStartsOn: 1 as const }; // Monday
export const WEEKLY_TARGET_DAYS = 5;

export function getWeekBounds(date: Date = new Date()) {
  const weekStart = startOfWeek(date, WEEK_OPTIONS);
  const weekEnd = endOfWeek(date, WEEK_OPTIONS);
  return { weekStart, weekEnd };
}

export function formatDateISO(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function computeWeeklyProgress(
  logs: Pick<StudyLog, "log_date">[],
  freezes: Pick<StreakFreeze, "freeze_date">[],
  referenceDate: Date = new Date()
): WeeklyProgress {
  const { weekStart, weekEnd } = getWeekBounds(referenceDate);
  const logDates = new Set(logs.map((l) => l.log_date));
  const freezeDates = new Set(freezes.map((f) => f.freeze_date));

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  let studyDays = 0;
  let freezeOnlyDays = 0;

  for (const day of days) {
    const iso = formatDateISO(day);
    const hasLog = logDates.has(iso);
    const hasFreeze = freezeDates.has(iso);
    if (hasLog) studyDays++;
    else if (hasFreeze) freezeOnlyDays++;
  }

  const effectiveDays = studyDays + freezeOnlyDays;

  return {
    weekStart: formatDateISO(weekStart),
    weekEnd: formatDateISO(weekEnd),
    studyDays,
    freezeDays: freezeOnlyDays,
    effectiveDays,
    targetDays: WEEKLY_TARGET_DAYS,
    isSuccessful: effectiveDays >= WEEKLY_TARGET_DAYS,
  };
}

export function computeWeeklyStreak(
  allLogs: Pick<StudyLog, "log_date">[],
  allFreezes: Pick<StreakFreeze, "freeze_date">[],
  referenceDate: Date = new Date()
): number {
  let streak = 0;
  let weekOffset = 0;

  while (weekOffset < 104) {
    const weekDate = subWeeks(referenceDate, weekOffset);
    const progress = computeWeeklyProgress(allLogs, allFreezes, weekDate);

    if (weekOffset === 0) {
      // Current week: only count toward streak if already successful
      if (progress.isSuccessful) {
        streak++;
        weekOffset++;
        continue;
      }
      break;
    }

    if (progress.isSuccessful) {
      streak++;
      weekOffset++;
    } else {
      break;
    }
  }

  return streak;
}

export function buildStudyCalendar(
  logs: Pick<StudyLog, "log_date">[],
  freezes: Pick<StreakFreeze, "freeze_date">[],
  daysBack = 14
): { date: string; hasLog: boolean; hasFreeze: boolean }[] {
  const logDates = new Set(logs.map((l) => l.log_date));
  const freezeDates = new Set(freezes.map((f) => f.freeze_date));
  const result: { date: string; hasLog: boolean; hasFreeze: boolean }[] = [];
  const today = new Date();

  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = formatDateISO(d);
    result.push({
      date: iso,
      hasLog: logDates.has(iso),
      hasFreeze: freezeDates.has(iso),
    });
  }

  return result;
}

export function deriveCorrectCount(
  completed: number,
  correct: number,
  wrong: number
): { correct: number; wrong: number; error?: string } {
  if (completed < 0 || correct < 0 || wrong < 0) {
    return { correct: 0, wrong: 0, error: "Values cannot be negative." };
  }

  let finalCorrect = correct;
  let finalWrong = wrong;

  if (correct === 0 && wrong > 0 && completed > 0) {
    finalCorrect = completed - wrong;
  }

  if (finalCorrect + finalWrong > completed) {
    return {
      correct: finalCorrect,
      wrong: finalWrong,
      error: "Correct + wrong cannot exceed completed.",
    };
  }

  return { correct: finalCorrect, wrong: finalWrong };
}

export function computeAccuracyPercent(
  completed: number,
  correct: number,
  wrong: number
): number | null {
  if (completed <= 0) return null;
  const derived = deriveCorrectCount(completed, correct, wrong);
  if (derived.error) return null;
  return Math.round((derived.correct / completed) * 1000) / 10;
}

export function updateHomeworkStatus(
  dueDate: string | null,
  status: string,
  completedAt: string | null
): "assigned" | "completed" | "late" | "missing" {
  if (status === "completed" || completedAt) return "completed";
  if (!dueDate) return status as "assigned";

  const due = parseISO(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isBefore(due, today)) {
    return "missing";
  }
  return "assigned";
}

export function resolveHomeworkStatuses<
  T extends { due_date: string | null; status: string; completed_at: string | null }
>(items: T[]): (T & { resolved_status: "assigned" | "completed" | "late" | "missing" })[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return items.map((item) => {
    if (item.status === "completed" || item.completed_at) {
      return { ...item, resolved_status: "completed" as const };
    }
    if (item.due_date) {
      const due = parseISO(item.due_date);
      if (isBefore(due, today)) {
        const resolved = item.status === "late" ? "late" : "missing";
        return { ...item, resolved_status: resolved as "late" | "missing" };
      }
    }
    return { ...item, resolved_status: "assigned" as const };
  });
}

export function filterLogsInRange(
  logs: StudyLog[],
  startDate: string,
  endDate: string
): StudyLog[] {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return logs.filter((log) => {
    const d = parseISO(log.log_date);
    return !isBefore(d, start) && !isAfter(d, end);
  });
}
