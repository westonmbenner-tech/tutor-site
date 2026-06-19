"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createMistakeLabel,
  deleteMistakeLabel,
} from "@/app/actions/mistakes";
import type { Mistake, MistakeLabel } from "@/lib/types";

const initialState = { error: null as string | null, success: false };

function DeleteMistakeLabelButton({
  studentId,
  label,
  mistakeCount,
}: {
  studentId: string;
  label: MistakeLabel;
  mistakeCount: number;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteMistakeLabel(studentId, label.id);
      if (result.error) {
        setError(result.error);
        return;
      }

      setConfirming(false);
      setError(null);
      router.refresh();
    });
  }

  if (confirming) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50/60 p-3 text-sm">
        <p className="text-slate-800">
          Delete <span className="font-medium">{label.name}</span>?
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          {mistakeCount > 0
            ? `${mistakeCount} mistake${mistakeCount === 1 ? "" : "s"} will become uncategorized.`
            : "This category has no mistakes yet."}
        </p>
        {error && (
          <p className="mt-2 text-xs text-[var(--color-danger)]">{error}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="btn btn-secondary text-xs text-[var(--color-danger)]"
          >
            {pending ? "Deleting…" : "Confirm delete"}
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
              setError(null);
            }}
            disabled={pending}
            className="btn btn-secondary text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-xs text-[var(--color-danger)] hover:underline"
    >
      Delete
    </button>
  );
}

export function AdminMistakeLabelsPanel({
  studentId,
  labels,
  mistakes,
}: {
  studentId: string;
  labels: MistakeLabel[];
  mistakes: Mistake[];
}) {
  const router = useRouter();
  const boundAction = createMistakeLabel.bind(null, studentId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  const countsByLabel = mistakes.reduce<Map<string, number>>((counts, mistake) => {
    if (!mistake.mistake_label_id) return counts;
    counts.set(
      mistake.mistake_label_id,
      (counts.get(mistake.mistake_label_id) ?? 0) + 1
    );
    return counts;
  }, new Map());

  return (
    <div className="mb-6 space-y-4 rounded-xl border border-[var(--color-border)] bg-slate-50/50 p-4">
      <div>
        <h3 className="text-sm font-medium text-slate-800">Mistake categories</h3>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Add or remove categories for this student. Deleting a category leaves
          its mistakes uncategorized.
        </p>
      </div>

      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div className="form-group mb-0 min-w-[12rem] flex-1">
          <label className="label" htmlFor="mistake-category-name">
            New category
          </label>
          <input
            id="mistake-category-name"
            name="name"
            type="text"
            required
            placeholder="e.g. Algebra"
            className="text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary text-sm"
        >
          {pending ? "Adding…" : "Add category"}
        </button>
      </form>

      {state.error && (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-[var(--color-primary)]">Category added.</p>
      )}

      {labels.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">No categories yet.</p>
      ) : (
        <ul className="space-y-2">
          {labels.map((label) => {
            const mistakeCount = countsByLabel.get(label.id) ?? 0;

            return (
              <li
                key={label.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-white px-3 py-2"
              >
                <div className="text-sm text-slate-800">
                  <span className="font-medium">{label.name}</span>
                  <span className="ml-2 text-xs text-[var(--color-muted)]">
                    {mistakeCount} mistake{mistakeCount === 1 ? "" : "s"}
                  </span>
                </div>
                <DeleteMistakeLabelButton
                  studentId={studentId}
                  label={label}
                  mistakeCount={mistakeCount}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
