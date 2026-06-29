import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DisplayDateTime } from "@/components/timezone/DisplayDateTime";
import { FormattedMultilineText } from "@/components/FormattedMultilineText";
import type { HomeworkAiGrading } from "@/lib/types";

export function GradingResultCard({ grading }: { grading: HomeworkAiGrading }) {
  const correctCount = grading.questions.filter((question) => question.correct).length;
  const missedCount = grading.questions.length - correctCount;

  return (
    <CollapsibleSection
      title={`${grading.overall_summary.slice(0, 72)}${
        grading.overall_summary.length > 72 ? "…" : ""
      }`}
      defaultOpen={false}
    >
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
          <span>
            Graded <DisplayDateTime iso={grading.created_at} variant="datetime" />
          </span>
          <span>·</span>
          <span className="capitalize">{grading.source_type}</span>
          <span>·</span>
          <span>{grading.source_label}</span>
          {grading.questions.length > 0 && (
            <>
              <span>·</span>
              <span>
                {correctCount}/{grading.questions.length} correct
              </span>
            </>
          )}
        </div>

        <div>
          <p className="font-medium text-slate-800">Overall summary</p>
          <FormattedMultilineText
            text={grading.overall_summary}
            className="mt-1 text-slate-700"
          />
        </div>

        {missedCount > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3">
            <p className="font-medium text-amber-900">Missed questions</p>
            <FormattedMultilineText
              text={grading.missed_questions_summary}
              className="mt-1 text-amber-950"
            />
          </div>
        )}

        {grading.questions.length > 0 && (
          <ul className="space-y-3">
            {grading.questions.map((question) => (
              <li
                key={`${grading.id}-${question.question_number}`}
                className="rounded-lg border border-[var(--color-border)] bg-slate-50/60 p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-800">
                    Q{question.question_number}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      question.correct
                        ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                        : "bg-red-50 text-[var(--color-danger)]"
                    }`}
                  >
                    {question.correct ? "Correct" : "Incorrect"}
                  </span>
                </div>
                <FormattedMultilineText
                  text={question.question_text}
                  className="mt-2 text-slate-700"
                />
                {question.student_answer && (
                  <div className="mt-2">
                    <p className="font-medium text-[var(--color-muted)]">
                      Student answer:
                    </p>
                    <FormattedMultilineText
                      text={question.student_answer}
                      className="text-[var(--color-muted)]"
                    />
                  </div>
                )}
                <FormattedMultilineText
                  text={question.feedback}
                  className="mt-2 text-slate-700"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </CollapsibleSection>
  );
}

export function HomeworkAiGradingHistory({
  gradings,
  title = "AI grading review",
}: {
  gradings: HomeworkAiGrading[];
  title?: string;
}) {
  if (gradings.length === 0) return null;

  const sorted = [...gradings].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );

  return (
    <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-white p-4">
      <p className="text-sm font-medium text-slate-800">{title}</p>
      <p className="mt-1 text-xs text-[var(--color-muted)]">
        Tutor AI review of your child&apos;s submission.
      </p>
      <ul className="mt-3 space-y-2">
        {sorted.map((grading) => (
          <li key={grading.id}>
            <GradingResultCard grading={grading} />
          </li>
        ))}
      </ul>
    </div>
  );
}
