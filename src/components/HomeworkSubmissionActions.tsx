"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearHomeworkSubmission,
  updateHomeworkSubmission,
} from "@/app/actions/homework";
import { ConfirmRemovalPanel } from "@/components/admin/ConfirmRemovalPanel";
import type { HomeworkAssignment } from "@/lib/types";

type ResolvedHomework = HomeworkAssignment & {
  resolved_status: "assigned" | "completed" | "late" | "missing";
};

const initialState = { error: null as string | null, success: false };

export function HomeworkSubmissionActions({
  item,
}: {
  item: ResolvedHomework;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const boundAction = updateHomeworkSubmission.bind(null, item.id);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (state.success) {
      setEditing(false);
      router.refresh();
    }
  }, [state.success, router]);

  if (!item.submission_text && item.resolved_status !== "completed") {
    return null;
  }

  if (editing) {
    return (
      <form action={formAction} className="w-full min-w-[240px] max-w-md space-y-3">
        <div className="form-group mb-0">
          <label className="label" htmlFor={`edit-submission-${item.id}`}>
            Edit your submission
          </label>
          <textarea
            id={`edit-submission-${item.id}`}
            name="submission_text"
            rows={4}
            required
            defaultValue={item.submission_text ?? ""}
          />
        </div>
        {state.error && (
          <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={pending} className="btn btn-primary text-sm">
            {pending ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="btn btn-secondary text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex w-full min-w-[240px] max-w-md flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="btn btn-secondary text-sm"
        >
          Edit submission
        </button>
        <ConfirmRemovalPanel
          entityLabel="Submission"
          entityName={`your submission for "${item.title}"`}
          consequences={[
            "Your written homework submission",
            "The completed status for this assignment",
          ]}
          redirectTo="/dashboard/homework"
          onRemove={() => clearHomeworkSubmission(item.id)}
        />
      </div>
    </div>
  );
}
