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
}: {
  studentId: string;
  parentCommentId: string;
  showVisibilityToggles?: boolean;
}) {
  const router = useRouter();
  const boundAction = replyToComment.bind(null, studentId, parentCommentId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="mt-3 space-y-2">
      <label className="sr-only" htmlFor={`reply-${parentCommentId}`}>
        Write a reply
      </label>
      <textarea
        id={`reply-${parentCommentId}`}
        name="comment"
        rows={2}
        required
        placeholder="Write a reply…"
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
        <p className="text-xs text-[var(--color-primary)]">Reply posted.</p>
      )}
      <button type="submit" disabled={pending} className="btn btn-secondary text-xs">
        {pending ? "Posting…" : "Post reply"}
      </button>
    </form>
  );
}

export type CommentReplyRole = UserRole | "admin";
