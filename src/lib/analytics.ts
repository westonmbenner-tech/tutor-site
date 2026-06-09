import type { AttentionFlag, Mistake, StudyLog, HomeworkAssignment } from "./types";
import { computeAccuracyPercent, deriveCorrectCount } from "./streak";
import { differenceInDays, parseISO } from "date-fns";

export interface TrendPoint {
  date: string;
  value: number;
}

export function aggregateStudyStats(logs: StudyLog[]) {
  let totalCompleted = 0;
  let totalWrong = 0;
  let totalCorrect = 0;
  let confidenceSum = 0;
  let confidenceCount = 0;

  for (const log of logs) {
    totalCompleted += log.questions_completed;
    const derived = deriveCorrectCount(
      log.questions_completed,
      log.questions_correct,
      log.questions_wrong
    );
    totalCorrect += derived.correct;
    totalWrong += derived.wrong;
    if (log.confidence) {
      confidenceSum += log.confidence;
      confidenceCount++;
    }
  }

  return {
    totalQuestionsCompleted: totalCompleted,
    totalQuestionsWrong: totalWrong,
    totalQuestionsCorrect: totalCorrect,
    accuracyPercent: computeAccuracyPercent(totalCompleted, totalCorrect, totalWrong),
    avgConfidence: confidenceCount > 0 ? confidenceSum / confidenceCount : null,
  };
}

export function buildAccuracyTrend(logs: StudyLog[]): TrendPoint[] {
  return [...logs]
    .sort((a, b) => a.log_date.localeCompare(b.log_date))
    .map((log) => ({
      date: log.log_date,
      value:
        computeAccuracyPercent(
          log.questions_completed,
          log.questions_correct,
          log.questions_wrong
        ) ?? 0,
    }))
    .filter((p) => p.value > 0);
}

export function buildQuestionsTrend(logs: StudyLog[]): TrendPoint[] {
  return [...logs]
    .sort((a, b) => a.log_date.localeCompare(b.log_date))
    .map((log) => ({
      date: log.log_date,
      value: log.questions_completed,
    }));
}

export function buildConfidenceTrend(logs: StudyLog[]): TrendPoint[] {
  return [...logs]
    .filter((l) => l.confidence != null)
    .sort((a, b) => a.log_date.localeCompare(b.log_date))
    .map((log) => ({
      date: log.log_date,
      value: log.confidence!,
    }));
}

export function countMistakeLabels(mistakes: Mistake[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const m of mistakes) {
    const name =
      (m.mistake_labels as { name?: string } | null)?.name ?? "Uncategorized";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function detectAttentionFlags(
  logs: StudyLog[],
  homework: HomeworkAssignment[],
  resolvedHomework: (HomeworkAssignment & { resolved_status: string })[]
): AttentionFlag[] {
  const flags: AttentionFlag[] = [];
  const sorted = [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date));
  const lastLog = sorted[0];

  if (!lastLog) {
    flags.push({ type: "no_log", message: "No study logs recorded yet." });
  } else {
    const daysSince = differenceInDays(new Date(), parseISO(lastLog.log_date));
    if (daysSince >= 3) {
      flags.push({
        type: "no_log",
        message: `No study log in ${daysSince} days.`,
      });
    }
  }

  const overdue = resolvedHomework.filter(
    (h) => h.resolved_status === "missing" || h.resolved_status === "late"
  );
  if (overdue.length > 0) {
    flags.push({
      type: "overdue_homework",
      message: `${overdue.length} overdue or missing assignment(s).`,
    });
  }

  const recent = logs.slice(0, 7);
  const avgConf =
    recent.filter((l) => l.confidence).reduce((s, l) => s + (l.confidence ?? 0), 0) /
    (recent.filter((l) => l.confidence).length || 1);
  if (recent.length >= 3 && avgConf < 2.5) {
    flags.push({
      type: "low_confidence",
      message: "Recent confidence ratings are low.",
    });
  }

  const trend = buildAccuracyTrend(logs);
  if (trend.length >= 4) {
    const recentAcc = trend.slice(-2).reduce((s, p) => s + p.value, 0) / 2;
    const priorAcc = trend.slice(-4, -2).reduce((s, p) => s + p.value, 0) / 2;
    if (recentAcc < priorAcc - 10) {
      flags.push({
        type: "declining_accuracy",
        message: "Accuracy has declined over recent sessions.",
      });
    }
  }

  return flags;
}

export function generateParentSummaryMarkdown(params: {
  studentName: string;
  startDate: string;
  endDate: string;
  logs: StudyLog[];
  homework: (HomeworkAssignment & { resolved_status: string })[];
  mistakes: Mistake[];
  comments: { comment: string; created_at: string; author?: string }[];
  weeklyProgressText: string;
  streakCount: number;
}): string {
  const stats = aggregateStudyStats(params.logs);
  const labels = countMistakeLabels(params.mistakes);
  const completedHw = params.homework.filter((h) => h.resolved_status === "completed");
  const missingHw = params.homework.filter(
    (h) => h.resolved_status === "missing" || h.resolved_status === "late"
  );

  const lines = [
    `# Progress Summary — ${params.studentName}`,
    "",
    `**Period:** ${params.startDate} to ${params.endDate}`,
    "",
    "## Study Activity",
    `- Total questions completed: **${stats.totalQuestionsCompleted}**`,
    `- Accuracy: **${stats.accuracyPercent ?? "N/A"}%**`,
    `- Study consistency: ${params.weeklyProgressText}`,
    `- Current weekly streak: **${params.streakCount} week(s)**`,
    "",
    "## Homework",
    `- Completed: ${completedHw.length}`,
    ...completedHw.map((h) => `  - ✓ ${h.title}`),
    `- Missing / late: ${missingHw.length}`,
    ...missingHw.map((h) => `  - ✗ ${h.title}${h.due_date ? ` (due ${h.due_date})` : ""}`),
    "",
    "## Common Mistake Categories",
    ...(labels.length
      ? labels.slice(0, 5).map((l) => `- ${l.name}: ${l.count} occurrence(s)`)
      : ["- No categorized mistakes in this period."]),
    "",
    "## Tutor Notes (shared with you)",
    ...(params.comments.length
      ? params.comments.map(
          (c) => `- *${c.created_at.slice(0, 10)}*: ${c.comment}`
        )
      : ["- No shared comments for this period."]),
    "",
    "## Suggested Focus Areas",
    ...(labels.length
      ? labels.slice(0, 3).map((l) => `- Review patterns related to **${l.name}**`)
      : ["- Continue steady daily practice and homework completion."]),
    "",
    "---",
    "_Generated by the tutoring accountability portal._",
  ];

  return lines.join("\n");
}
