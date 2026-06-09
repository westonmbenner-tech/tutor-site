"use client";

import { useActionState } from "react";
import { createMistake } from "@/app/actions/mistakes";
import type { MistakeLabel } from "@/lib/types";
import { formatDateISO } from "@/lib/streak";

const initialState = { error: null as string | null, success: false };

export function MistakeForm({
  studentId,
  labels,
  studyLogId,
  defaultDate,
}: {
  studentId: string;
  labels: MistakeLabel[];
  studyLogId?: string | null;
  defaultDate?: string;
}) {
  const today = defaultDate ?? formatDateISO(new Date());
  const boundAction = createMistake.bind(null, studentId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="mistake_date" value={today} />
      {studyLogId && (
        <input type="hidden" name="study_log_id" value={studyLogId} />
      )}

      <div className="form-group">
        <label className="label" htmlFor="question_prompt">
          What was the question asking?
        </label>
        <textarea id="question_prompt" name="question_prompt" rows={2} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="form-group">
          <label className="label" htmlFor="topic">
            Topic
          </label>
          <input id="topic" name="topic" type="text" />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="mistake_label_id">
            Mistake type (your label)
          </label>
          <select id="mistake_label_id" name="mistake_label_id" defaultValue="">
            <option value="">Select a label</option>
            {labels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="label" htmlFor="new_label_name">
          Or create a new label
        </label>
        <input
          id="new_label_name"
          name="new_label_name"
          type="text"
          placeholder="e.g. Rushed reading, Sign error"
        />
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Tagging mistakes yourself builds reflection — AI grouping comes later.
        </p>
      </div>

      <div className="form-group">
        <label className="label" htmlFor="explanation">
          What went wrong?
        </label>
        <textarea id="explanation" name="explanation" rows={2} />
      </div>

      <div className="form-group">
        <label className="label" htmlFor="lesson_learned">
          Lesson learned
        </label>
        <textarea id="lesson_learned" name="lesson_learned" rows={2} />
      </div>

      {state.error && (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-[var(--color-primary)]">Mistake recorded.</p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Saving…" : "Add mistake"}
      </button>
    </form>
  );
}
