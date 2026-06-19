"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createHomeworkComment } from "@/app/actions/homework";

const initialState = { error: null as string | null, success: false };

export function HomeworkCommentForm({
  studentId,
  homeworkAssignmentId,
}: {
  studentId: string;
  homeworkAssignmentId: string;
}) {
  const router = useRouter();
  const boundAction = createHomeworkComment.bind(
    null,
    studentId,
    homeworkAssignmentId
  );
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-2">
      <label
        className="text-sm font-medium text-slate-800"
        htmlFor={`homework-comment-${homeworkAssignmentId}`}
      >
        Add a comment
      </label>
      <textarea
        id={`homework-comment-${homeworkAssignmentId}`}
        name="comment"
        rows={3}
        required
        placeholder="Ask a question or leave a note about this assignment…"
        className="text-sm"
      />
      {state.error && (
        <p className="text-xs text-[var(--color-danger)]">{state.error}</p>
      )}
      {state.success && (
        <p className="text-xs text-[var(--color-primary)]">Comment posted.</p>
      )}
      <button type="submit" disabled={pending} className="btn btn-secondary text-sm">
        {pending ? "Posting…" : "Post comment"}
      </button>
    </form>
  );
}
