import type {
  HomeworkAiGrading,
  HomeworkAiQuestionResult,
  HomeworkAssignment,
} from "@/lib/types";
import { parseHomeworkMasterySession } from "@/lib/homework-mastery";

function parseQuestion(raw: unknown): HomeworkAiQuestionResult | null {
  if (!raw || typeof raw !== "object") return null;

  const row = raw as Record<string, unknown>;
  if (typeof row.question_number !== "number") return null;
  if (typeof row.question_text !== "string") return null;
  if (typeof row.correct !== "boolean") return null;
  if (typeof row.feedback !== "string") return null;

  return {
    question_number: row.question_number,
    question_text: row.question_text,
    student_answer:
      typeof row.student_answer === "string" ? row.student_answer : null,
    correct: row.correct,
    feedback: row.feedback,
  };
}

export function parseHomeworkAiGradings(raw: unknown): HomeworkAiGrading[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry): HomeworkAiGrading | null => {
      if (!entry || typeof entry !== "object") return null;

      const row = entry as Record<string, unknown>;
      if (typeof row.id !== "string") return null;
      if (typeof row.created_at !== "string") return null;
      if (row.source_type !== "image" && row.source_type !== "url" && row.source_type !== "text") return null;
      if (typeof row.source_label !== "string") return null;
      if (typeof row.overall_summary !== "string") return null;
      if (typeof row.missed_questions_summary !== "string") return null;

      const questions = Array.isArray(row.questions)
        ? row.questions
            .map(parseQuestion)
            .filter((question): question is HomeworkAiQuestionResult =>
              Boolean(question)
            )
        : [];

      return {
        id: row.id,
        created_at: row.created_at,
        created_by: typeof row.created_by === "string" ? row.created_by : null,
        submission_snapshot:
          typeof row.submission_snapshot === "string"
            ? row.submission_snapshot
            : null,
        source_type: row.source_type,
        source_label: row.source_label,
        overall_summary: row.overall_summary,
        questions,
        missed_questions_summary: row.missed_questions_summary,
      };
    })
    .filter((entry): entry is HomeworkAiGrading => Boolean(entry))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function withHomeworkAiGradings<
  T extends { ai_gradings?: unknown },
>(row: T): T & { ai_gradings: HomeworkAiGrading[] } {
  return {
    ...row,
    ai_gradings: parseHomeworkAiGradings(row.ai_gradings),
  };
}

export function normalizeHomeworkRows(
  rows: (HomeworkAssignment & { ai_gradings?: unknown; description_format?: unknown })[]
): HomeworkAssignment[] {
  return rows.map((row) => ({
    ...withHomeworkAiGradings(row),
    description_format:
      row.description_format === "latex" ? "latex" : ("plain" as const),
    mandate_ai_mastery: row.mandate_ai_mastery === true,
    mastery_source_type:
      row.mastery_source_type === "text" || row.mastery_source_type === "url"
        ? row.mastery_source_type
        : null,
    mastery_source_text:
      typeof row.mastery_source_text === "string" ? row.mastery_source_text : null,
    mastery_source_url:
      typeof row.mastery_source_url === "string" ? row.mastery_source_url : null,
    mastery_session: parseHomeworkMasterySession(row.mastery_session),
    notify_parent_on_submit: row.notify_parent_on_submit === true,
  }));
}
