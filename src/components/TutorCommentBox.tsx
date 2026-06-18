"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTutorComment } from "@/app/actions/homework";
import { DisplayDateTime } from "@/components/timezone/DisplayDateTime";

const initialState = { error: null as string | null, success: false };

export function TutorCommentBox({
  studentId,
  studyLogId,
  homeworkAssignmentId,
}: {
  studentId: string;
  studyLogId?: string | null;
  homeworkAssignmentId?: string | null;
}) {
  const router = useRouter();
  const boundAction = createTutorComment.bind(null, studentId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-[var(--color-border)] bg-slate-50 p-4">
      {studyLogId && (
        <input type="hidden" name="study_log_id" value={studyLogId} />
      )}
      {homeworkAssignmentId && (
        <input
          type="hidden"
          name="homework_assignment_id"
          value={homeworkAssignmentId}
        />
      )}
      <div className="form-group mb-0">
        <label className="label" htmlFor="comment">
          Tutor comment
        </label>
        <textarea id="comment" name="comment" rows={3} required />
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="visible_to_student" defaultChecked />
          Visible to student
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="visible_to_parent" />
          Visible to parent
        </label>
      </div>
      {state.error && (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-[var(--color-primary)]">Comment posted.</p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary text-sm">
        Post comment
      </button>
    </form>
  );
}

export function TutorCommentList({
  comments,
}: {
  comments: {
    id: string;
    comment: string;
    created_at: string;
    profiles?: { full_name: string | null } | null;
    visible_to_student?: boolean;
    visible_to_parent?: boolean;
  }[];
}) {
  if (comments.length === 0) {
    return <div className="empty-state">No comments yet.</div>;
  }

  return (
    <ul className="space-y-3">
      {comments.map((c) => (
        <li
          key={c.id}
          className="rounded-lg border border-[var(--color-border)] bg-white p-4"
        >
          <p className="text-sm text-slate-700">{c.comment}</p>
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            {c.profiles?.full_name ?? "Tutor"} ·{" "}
            <DisplayDateTime iso={c.created_at} variant="datetime" />
          </p>
        </li>
      ))}
    </ul>
  );
}
