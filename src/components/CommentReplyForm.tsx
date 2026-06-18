"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { replyToComment } from "@/app/actions/homework";
import type { UserRole } from "@/lib/types";

const initialState = { error: null as string | null, success: false };

export function CommentReplyForm({
  studentId,
  parentCommentId,
  showVisibilityToggles = false,
  useTutorCommentLabels = false,
}: {
  studentId: string;
  parentCommentId: string;
  showVisibilityToggles?: boolean;
  useTutorCommentLabels?: boolean;
}) {
  const router = useRouter();
  const boundAction = replyToComment.bind(null, studentId, parentCommentId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  const fieldLabel = useTutorCommentLabels ? "Tutor comment" : "Write a reply";
  const placeholder = useTutorCommentLabels
    ? "Write a tutor comment…"
    : "Write a reply…";
  const submitLabel = useTutorCommentLabels ? "Post comment" : "Post reply";
  const successMessage = useTutorCommentLabels ? "Comment posted." : "Reply posted.";

  return (
    <form action={formAction} className="mt-3 space-y-2">
      <label className="sr-only" htmlFor={`reply-${parentCommentId}`}>
        {fieldLabel}
      </label>
      <textarea
        id={`reply-${parentCommentId}`}
        name="comment"
        rows={useTutorCommentLabels ? 3 : 2}
        required
        placeholder={placeholder}
        className="text-sm"
      />
      {showVisibilityToggles && (
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="visible_to_student" defaultChecked />
            Visible to student
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="visible_to_parent" />
            Visible to parent
          </label>
        </div>
      )}
      {state.error && (
        <p className="text-xs text-[var(--color-danger)]">{state.error}</p>
      )}
      {state.success && (
        <p className="text-xs text-[var(--color-primary)]">{successMessage}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className={`text-sm ${useTutorCommentLabels ? "btn btn-primary" : "btn btn-secondary text-xs"}`}
      >
        {pending ? "Posting…" : submitLabel}
      </button>
    </form>
  );
}

export type CommentReplyRole = UserRole | "admin";
