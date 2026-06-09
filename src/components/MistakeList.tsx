import type { Mistake } from "@/lib/types";

export function MistakeList({ mistakes }: { mistakes: Mistake[] }) {
  if (mistakes.length === 0) {
    return <div className="empty-state">No mistakes recorded yet.</div>;
  }

  return (
    <ul className="space-y-3">
      {mistakes.map((m) => (
        <li
          key={m.id}
          className="rounded-lg border border-[var(--color-border)] bg-slate-50/50 p-4"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
            <span>{m.mistake_date}</span>
            {m.topic && <span>· {m.topic}</span>}
            {(m.mistake_labels as { name?: string } | null)?.name && (
              <span className="rounded-full bg-white px-2 py-0.5 font-medium text-slate-600">
                {(m.mistake_labels as { name: string }).name}
              </span>
            )}
          </div>
          {m.question_prompt && (
            <p className="mt-2 text-sm font-medium text-slate-800">
              {m.question_prompt}
            </p>
          )}
          {m.explanation && (
            <p className="mt-1 text-sm text-slate-600">{m.explanation}</p>
          )}
          {m.lesson_learned && (
            <p className="mt-2 text-sm text-[var(--color-primary)]">
              Lesson: {m.lesson_learned}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
