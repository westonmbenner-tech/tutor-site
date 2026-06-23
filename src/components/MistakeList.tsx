"use client";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { FormattedMultilineText } from "@/components/FormattedMultilineText";
import type { Mistake } from "@/lib/types";
import { getMistakeLabelName } from "@/lib/mistakes-utils";

function mistakeTitle(m: Mistake): string {
  const label = getMistakeLabelName(m);
  const parts: string[] = [m.mistake_date];

  if (m.topic) {
    parts.push(m.topic);
  } else if (m.question_prompt) {
    const preview =
      m.question_prompt.length > 72
        ? `${m.question_prompt.slice(0, 72)}…`
        : m.question_prompt;
    parts.push(preview);
  }

  if (label !== "Uncategorized") {
    parts.push(label);
  }

  return parts.join(" · ");
}

export function MistakeList({
  mistakes,
  emptyMessage = "No mistakes recorded yet.",
}: {
  mistakes: Mistake[];
  emptyMessage?: string;
}) {
  if (mistakes.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  return (
    <ul className="space-y-2">
      {mistakes.map((m) => {
        const label = getMistakeLabelName(m);

        return (
          <li key={m.id}>
            <CollapsibleSection title={mistakeTitle(m)} defaultOpen={false}>
              <div className="space-y-2 text-sm">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
                  <span>{m.mistake_date}</span>
                  {m.topic && <span>· {m.topic}</span>}
                  {label !== "Uncategorized" && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                      {label}
                    </span>
                  )}
                </div>
                {m.question_prompt && (
                  <FormattedMultilineText
                    text={m.question_prompt}
                    className="font-medium text-slate-800"
                  />
                )}
                {m.explanation && (
                  <FormattedMultilineText
                    text={m.explanation}
                    className="text-slate-600"
                  />
                )}
                {m.lesson_learned && (
                  <div>
                    <p className="font-medium text-[var(--color-primary)]">Lesson:</p>
                    <FormattedMultilineText
                      text={m.lesson_learned}
                      className="text-[var(--color-primary)]"
                    />
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </li>
        );
      })}
    </ul>
  );
}
