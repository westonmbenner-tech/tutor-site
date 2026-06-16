"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completeHomework } from "@/app/actions/homework";
import type { HomeworkAssignment } from "@/lib/types";

type ResolvedHomework = HomeworkAssignment & {
  resolved_status: "assigned" | "completed" | "late" | "missing";
};

const initialState = { error: null as string | null, success: false };

export function HomeworkCompleteForm({ item }: { item: ResolvedHomework }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const boundAction = completeHomework.bind(null, item.id);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state.success, router]);

  if (item.resolved_status === "completed") {
    return null;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-secondary text-sm"
      >
        Mark complete
      </button>
    );
  }

  return (
    <form action={formAction} className="w-full min-w-[240px] max-w-md space-y-3">
      <div className="form-group mb-0">
        <label className="label" htmlFor={`submission-${item.id}`}>
          What did you complete?
        </label>
        <textarea
          id={`submission-${item.id}`}
          name="submission_text"
          rows={4}
          required
          placeholder="Describe the work you finished, problems you solved, or notes for your tutor…"
        />
      </div>
      {state.error && (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-[var(--color-primary)]">Homework submitted.</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className="btn btn-primary text-sm">
          {pending ? "Submitting…" : "Submit homework"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn btn-secondary text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
