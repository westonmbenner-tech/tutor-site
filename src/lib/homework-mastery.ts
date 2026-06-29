import type {
  HomeworkMasteryAnswer,
  HomeworkMasteryQuestion,
  HomeworkMasterySession,
} from "@/lib/types";

export const MASTERY_PASS_THRESHOLD = 80;
export const MASTERY_MIN_QUESTIONS = 10;
export const MASTERY_MAX_QUESTIONS = 15;

function parseQuestion(raw: unknown): HomeworkMasteryQuestion | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const questionNumber =
    typeof row.question_number === "number" ? row.question_number : null;
  if (!questionNumber || typeof row.question_text !== "string") return null;

  const questionType =
    row.question_type === "calculation" ? "calculation" : "conceptual";

  return {
    question_number: questionNumber,
    question_text: row.question_text.trim(),
    question_type: questionType,
  };
}

function parseAnswer(raw: unknown): HomeworkMasteryAnswer | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.question_number !== "number") return null;
  if (typeof row.student_answer !== "string") return null;
  if (typeof row.correct !== "boolean") return null;
  if (typeof row.feedback !== "string") return null;

  return {
    question_number: row.question_number,
    student_answer: row.student_answer,
    correct: row.correct,
    feedback: row.feedback,
  };
}

export function parseHomeworkMasterySession(
  raw: unknown
): HomeworkMasterySession | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;

  const status =
    row.status === "in_progress" ||
    row.status === "completed" ||
    row.status === "not_started"
      ? row.status
      : "not_started";

  const questions = Array.isArray(row.questions)
    ? row.questions
        .map(parseQuestion)
        .filter((q): q is HomeworkMasteryQuestion => Boolean(q))
        .sort((a, b) => a.question_number - b.question_number)
    : [];

  const answers = Array.isArray(row.answers)
    ? row.answers
        .map(parseAnswer)
        .filter((a): a is HomeworkMasteryAnswer => Boolean(a))
    : [];

  return {
    status,
    questions,
    answers,
    score_percent:
      typeof row.score_percent === "number" ? row.score_percent : null,
    passed: row.passed === true,
    pass_threshold:
      typeof row.pass_threshold === "number"
        ? row.pass_threshold
        : MASTERY_PASS_THRESHOLD,
    started_at: typeof row.started_at === "string" ? row.started_at : null,
    completed_at:
      typeof row.completed_at === "string" ? row.completed_at : null,
  };
}

export function createEmptyMasterySession(): HomeworkMasterySession {
  return {
    status: "not_started",
    questions: [],
    answers: [],
    score_percent: null,
    passed: false,
    pass_threshold: MASTERY_PASS_THRESHOLD,
    started_at: null,
    completed_at: null,
  };
}

export function computeMasteryScore(answers: HomeworkMasteryAnswer[]): number {
  if (answers.length === 0) return 0;
  const correct = answers.filter((answer) => answer.correct).length;
  return Math.round((correct / answers.length) * 100);
}

export function finalizeMasterySession(
  session: HomeworkMasterySession
): HomeworkMasterySession {
  const scorePercent = computeMasteryScore(session.answers);
  const passed = scorePercent >= session.pass_threshold;

  return {
    ...session,
    status: "completed",
    score_percent: scorePercent,
    passed,
    completed_at: new Date().toISOString(),
  };
}

export function masterySessionPassed(raw: unknown): boolean {
  const session = parseHomeworkMasterySession(raw);
  return session?.passed === true;
}
