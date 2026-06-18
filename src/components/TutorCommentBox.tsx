"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTutorComment } from "@/app/actions/homework";
import { CommentReplyForm, type CommentReplyRole } from "@/components/CommentReplyForm";
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
  studyLogId,
  homeworkAssignmentId,
  useTutorCommentLabels = false,
}: {
  comments: TutorComment[];
  studentId?: string;
  currentUserId?: string;
  replyAs?: CommentReplyRole;
  showTopLevelComposer?: boolean;
  studyLogId?: string | null;
  homeworkAssignmentId?: string | null;
  useTutorCommentLabels?: boolean;
}) {
  if (comments.length === 0 && !showTopLevelComposer) {
    return <div className="empty-state">No comments yet.</div>;
  }

  const threads = buildCommentThreads(comments);
  const canReply = Boolean(studentId && replyAs);

  return (
    <div className="space-y-4">
      {showTopLevelComposer && studentId && replyAs === "admin" && (
        <TutorCommentBox
          studentId={studentId}
          studyLogId={studyLogId}
          homeworkAssignmentId={homeworkAssignmentId}
        />
      )}

      {threads.length === 0 ? (
        <div className="empty-state">No comments yet.</div>
      ) : (
        <ul className="space-y-4">
          {threads.map(({ root, replies }) => {
            const rootReplyAllowed =
              canReply && canReplyToComment(root, replyAs ?? "student");

            return (
              <li key={root.id} className="space-y-2">
                <CommentItem comment={root} currentUserId={currentUserId} />
                {replies.length > 0 && (
                  <ul className="space-y-2">
                    {replies.map((reply) => {
                      const replyAllowed =
                        canReply && canReplyToComment(reply, replyAs ?? "student");

                      return (
                        <li key={reply.id}>
                          <CommentItem
                            comment={reply}
                            currentUserId={currentUserId}
                            indent
                          />
                          {replyAllowed && studentId && (
                            <CommentReplyForm
                              studentId={studentId}
                              parentCommentId={reply.id}
                              showVisibilityToggles={replyAs === "admin"}
                              useTutorCommentLabels={useTutorCommentLabels}
                            />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {rootReplyAllowed && studentId && (
                  <CommentReplyForm
                    studentId={studentId}
                    parentCommentId={root.id}
                    showVisibilityToggles={replyAs === "admin"}
                    useTutorCommentLabels={useTutorCommentLabels}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export type { CommentReplyRole };
