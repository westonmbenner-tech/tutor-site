"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTutorComment } from "@/app/actions/homework";
import { CommentReplyForm, type CommentReplyRole } from "@/components/CommentReplyForm";
import { HomeworkCommentForm } from "@/components/HomeworkCommentForm";
import { FormattedMultilineText } from "@/components/FormattedMultilineText";
import { DisplayDateTime } from "@/components/timezone/DisplayDateTime";
import {
  buildCommentThreads,
  canReplyToComment,
  commentAuthorLabel,
  commentRoleLabel,
} from "@/lib/comments";
import type { TutorComment } from "@/lib/types";

const initialState = { error: null as string | null, success: false };

export function TutorCommentBox({
  studentId,
  studyLogId,
  homeworkAssignmentId,
  useReplyLabels = false,
}: {
  studentId: string;
  studyLogId?: string | null;
  homeworkAssignmentId?: string | null;
  useReplyLabels?: boolean;
}) {
  const router = useRouter();
  const boundAction = createTutorComment.bind(null, studentId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  const fieldLabel = useReplyLabels ? "Write a reply" : "Tutor comment";
  const submitLabel = useReplyLabels ? "Post reply" : "Post comment";
  const successMessage = useReplyLabels ? "Reply posted." : "Comment posted.";

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
          {fieldLabel}
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
        <p className="text-sm text-[var(--color-primary)]">{successMessage}</p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary text-sm">
        {pending ? "Posting…" : submitLabel}
      </button>
    </form>
  );
}

function CommentItem({
  comment,
  currentUserId,
  indent = false,
}: {
  comment: TutorComment;
  currentUserId?: string;
  indent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-[var(--color-border)] bg-white p-3 ${
        indent ? "ml-4 border-l-2 border-l-[var(--color-primary-light)]" : ""
      }`}
    >
      <FormattedMultilineText
        text={comment.comment}
        className="text-sm text-slate-700"
      />
      <p className="mt-2 text-xs text-[var(--color-muted)]">
        {commentAuthorLabel(comment, currentUserId)} · {commentRoleLabel(comment)} ·{" "}
        <DisplayDateTime iso={comment.created_at} variant="datetime" />
      </p>
    </div>
  );
}

export function TutorCommentList({
  comments,
  studentId,
  currentUserId,
  replyAs,
  showTopLevelComposer = false,
  showHomeworkThreadStart = false,
  studyLogId,
  homeworkAssignmentId,
  useTutorCommentLabels = false,
  useReplyLabelsForComposer = false,
}: {
  comments: TutorComment[];
  studentId?: string;
  currentUserId?: string;
  replyAs?: CommentReplyRole;
  showTopLevelComposer?: boolean;
  showHomeworkThreadStart?: boolean;
  studyLogId?: string | null;
  homeworkAssignmentId?: string | null;
  useTutorCommentLabels?: boolean;
  useReplyLabelsForComposer?: boolean;
}) {
  if (
    comments.length === 0 &&
    !showTopLevelComposer &&
    !showHomeworkThreadStart
  ) {
    return <div className="empty-state">No comments yet.</div>;
  }

  const threads = buildCommentThreads(comments);
  const canReply = Boolean(studentId && replyAs);
  const showAdminComposer =
    showTopLevelComposer && studentId && replyAs === "admin";
  const showHomeworkStartComposer =
    showHomeworkThreadStart &&
    studentId &&
    homeworkAssignmentId &&
    replyAs &&
    replyAs !== "admin";

  return (
    <div className="space-y-4">
      {threads.length === 0 && !showAdminComposer && !showHomeworkStartComposer ? (
        <div className="empty-state">No comments yet.</div>
      ) : (
        <ul className="space-y-4">
          {threads.map(({ root, replies }) => {
            const latestComment =
              replies.length > 0 ? replies[replies.length - 1] : root;
            const threadReplyAllowed =
              canReply &&
              canReplyToComment(latestComment, replyAs ?? "student");

            return (
              <li key={root.id} className="space-y-2">
                <CommentItem comment={root} currentUserId={currentUserId} />
                {replies.length > 0 && (
                  <ul className="space-y-2">
                    {replies.map((reply) => (
                      <li key={reply.id}>
                        <CommentItem
                          comment={reply}
                          currentUserId={currentUserId}
                          indent
                        />
                      </li>
                    ))}
                  </ul>
                )}
                {threadReplyAllowed && studentId && (
                  <CommentReplyForm
                    studentId={studentId}
                    parentCommentId={latestComment.id}
                    showVisibilityToggles={replyAs === "admin"}
                    useTutorCommentLabels={useTutorCommentLabels}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {showAdminComposer && (
        <TutorCommentBox
          studentId={studentId}
          studyLogId={studyLogId}
          homeworkAssignmentId={homeworkAssignmentId}
          useReplyLabels={useReplyLabelsForComposer}
        />
      )}

      {showHomeworkStartComposer && threads.length === 0 && (
        <HomeworkCommentForm
          studentId={studentId}
          homeworkAssignmentId={homeworkAssignmentId}
        />
      )}
    </div>
  );
}

export type { CommentReplyRole };
