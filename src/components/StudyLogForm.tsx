"use client";

import { useActionState } from "react";
import { submitStudyLog } from "@/app/actions/study-logs";
import { formatDateISO } from "@/lib/streak";

const initialState = { error: null as string | null, success: false };

export function StudyLogForm({
  studentId,
  defaultDate,
  existingLog,
}: {
  studentId: string;
  defaultDate?: string;
  existingLog?: {
    questions_completed: number;
    questions_correct: number;
    questions_wrong: number;
    topic: string | null;
    confidence: number | null;
    errors_lessons_learned: string | null;
    miscellaneous_notes: string | null;
  } | null;
}) {
  const today = defaultDate ?? formatDateISO(new Date());
  const boundAction = submitStudyLog.bind(null, studentId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="log_date" value={today} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="form-group">
          <label className="label" htmlFor="questions_completed">
            Questions completed
          </label>
          <input
            id="questions_completed"
            name="questions_completed"
            type="number"
            min={0}
            defaultValue={existingLog?.questions_completed ?? 0}
            required
          />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="questions_correct">
            Correct
          </label>
          <input
            id="questions_correct"
            name="questions_correct"
            type="number"
            min={0}
            defaultValue={existingLog?.questions_correct ?? 0}
          />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="questions_wrong">
            Wrong
          </label>
          <input
            id="questions_wrong"
            name="questions_wrong"
            type="number"
            min={0}
            defaultValue={existingLog?.questions_wrong ?? 0}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="form-group">
          <label className="label" htmlFor="topic">
            Topic
          </label>
          <input
            id="topic"
            name="topic"
            type="text"
            placeholder="e.g. Algebra — linear equations"
            defaultValue={existingLog?.topic ?? ""}
          />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="confidence">
            Confidence (1–5)
          </label>
          <select
            id="confidence"
            name="confidence"
            defaultValue={existingLog?.confidence ?? ""}
          >
            <option value="">—</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="label" htmlFor="errors_lessons_learned">
          Errors / lessons learned
        </label>
        <textarea
          id="errors_lessons_learned"
          name="errors_lessons_learned"
          rows={3}
          defaultValue={existingLog?.errors_lessons_learned ?? ""}
        />
      </div>

      <div className="form-group">
        <label className="label" htmlFor="miscellaneous_notes">
          Notes
        </label>
        <textarea
          id="miscellaneous_notes"
          name="miscellaneous_notes"
          rows={2}
          defaultValue={existingLog?.miscellaneous_notes ?? ""}
        />
      </div>

      {state.error && (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-[var(--color-primary)]">
          Study log saved for today.
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Saving…" : existingLog ? "Update today's log" : "Save today's log"}
      </button>
    </form>
  );
}
