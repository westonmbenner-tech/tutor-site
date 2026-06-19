"use client";

import type { HomeworkAssignment, TutorComment } from "@/lib/types";
import { FormattedMultilineText } from "@/components/FormattedMultilineText";
import { HomeworkCompleteForm } from "@/components/HomeworkCompleteForm";
import { HomeworkSubmissionActions } from "@/components/HomeworkSubmissionActions";
import { TutorCommentList } from "@/components/TutorCommentBox";
import type { CommentReplyRole } from "@/components/CommentReplyForm";
import { filterHomeworkComments } from "@/lib/comments";

type ResolvedHomework = HomeworkAssignment & {
  resolved_status: "assigned" | "completed" | "late" | "missing";
};

const statusStyles: Record<string, string> = {
  assigned: "bg-slate-100 text-slate-700",
  completed: "bg-[var(--color-primary-light)] text-[var(--color-primary)]",
  late: "bg-amber-50 text-[var(--color-warning)]",
  missing: "bg-red-50 text-[var(--color-danger)]",
};

export function HomeworkList({
  items,
  showCompleteButton = false,
  comments = [],
  studentId,
  currentUserId,
  replyAs,
}: {
  items: ResolvedHomework[];
  showCompleteButton?: boolean;
  comments?: TutorComment[];
  studentId?: string;
  currentUserId?: string;
  replyAs?: CommentReplyRole;
}) {
  if (items.length === 0) {
    return (
      <div className="empty-state">No homework assignments to show.</div>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => {
        const hasSubmission =
          Boolean(item.submission_text) || item.resolved_status === "completed";
        const showComments =
          hasSubmission &&
          Boolean(studentId && currentUserId && replyAs && replyAs !== "admin");
        const homeworkComments =
          showComments && studentId && currentUserId && replyAs
            ? filterHomeworkComments(
                comments,
                item.id,
                replyAs === "parent" ? "parent" : "student",
                currentUserId
              )
            : [];

        return (
          <li
            key={item.id}
            className="rounded-xl border border-[var(--color-border)] bg-slate-50/50 p-4 sm:p-5"
          >
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-medium text-slate-800">
                  {item.title}
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[item.resolved_status]}`}
                >
                  {item.resolved_status}
                </span>
              </div>

              {item.description && (
                <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                  {item.description}
                </p>
              )}

              {item.due_date && (
                <p className="text-sm text-[var(--color-muted)]">
                  Due {item.due_date}
                </p>
              )}

              {item.submission_text && (
                <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
                  <p className="text-sm font-medium text-slate-800">
                    {showCompleteButton ? "Your submission" : "Submission"}
                  </p>
                  <FormattedMultilineText
                    text={item.submission_text}
                    className="mt-2 text-sm leading-relaxed text-slate-700"
                  />
                </div>
              )}

              {Array.isArray(item.links) && item.links.length > 0 && (
                <ul className="space-y-1.5">
                  {item.links.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[var(--color-accent)] hover:underline"
                      >
                        {link.label || link.url}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {showCompleteButton && (
              <div className="mt-5 border-t border-[var(--color-border)] pt-4">
                {hasSubmission ? (
                  <HomeworkSubmissionActions item={item} />
                ) : (
                  <HomeworkCompleteForm item={item} />
                )}
              </div>
            )}

            {showComments && studentId && currentUserId && replyAs && (
              <div className="mt-5 border-t border-[var(--color-border)] pt-4">
                <p className="mb-3 text-sm font-medium text-slate-800">Comments</p>
                <TutorCommentList
                  comments={homeworkComments}
                  studentId={studentId}
                  currentUserId={currentUserId}
                  replyAs={replyAs}
                  homeworkAssignmentId={item.id}
                  showHomeworkThreadStart
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
