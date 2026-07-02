import Link from "next/link";
import { TutorCommentList } from "@/components/TutorCommentBox";
import { HomeworkAutoGraderPanel } from "@/components/admin/HomeworkAutoGraderPanel";
import { HomeworkAssignmentAdminActions } from "@/components/admin/HomeworkAssignmentAdminActions";
import { DisplayDateTime } from "@/components/timezone/DisplayDateTime";
import { FormattedMultilineText } from "@/components/FormattedMultilineText";
import { HomeworkDescription } from "@/components/HomeworkDescription";
import {
  countParentHomeworkComments,
  getHomeworkComments,
  homeworkHasReviewActivity,
} from "@/lib/comments";
import type { HomeworkAssignment, TutorComment } from "@/lib/types";

type ResolvedHomework = HomeworkAssignment & {
  resolved_status: "assigned" | "completed" | "late" | "missing";
};

const statusStyles: Record<string, string> = {
  assigned: "bg-slate-100 text-slate-700",
  completed: "bg-[var(--color-primary-light)] text-[var(--color-primary)]",
  late: "bg-amber-50 text-[var(--color-warning)]",
  missing: "bg-red-50 text-[var(--color-danger)]",
};

export function HomeworkAssignmentDetail({
  item,
  studentName,
  comments,
  currentUserId,
}: {
  item: ResolvedHomework;
  studentName: string;
  comments: TutorComment[];
  currentUserId?: string;
}) {
  const hasSubmission =
    Boolean(item.submission_text) || item.resolved_status === "completed";
  const homeworkComments = getHomeworkComments(comments, item.id);
  const parentCommentCount = countParentHomeworkComments(comments, item.id);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[var(--color-muted)]">{studentName}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold text-slate-800">{item.title}</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[item.resolved_status]}`}
          >
            {item.resolved_status}
          </span>
        </div>
        {item.due_date && (
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Due {item.due_date}
          </p>
        )}
        {item.description && (
          <HomeworkDescription
            text={item.description}
            format={item.description_format ?? "plain"}
            className="mt-3 text-sm text-slate-700"
          />
        )}
        {Array.isArray(item.links) && item.links.length > 0 && (
          <ul className="mt-3 space-y-1">
            {item.links.map((link, index) => (
              <li key={index}>
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

      <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--color-muted)]">
          Student submission
        </h2>
        {item.completed_at && (
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            Submitted <DisplayDateTime iso={item.completed_at} variant="datetime" />
          </p>
        )}
        {item.submission_text ? (
          <FormattedMultilineText
            text={item.submission_text}
            className="mt-3 text-sm text-slate-700"
          />
        ) : hasSubmission ? (
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            Marked complete with no written submission.
          </p>
        ) : (
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            Not submitted yet.
          </p>
        )}
      </section>

      {hasSubmission && item.submission_text && (
        <HomeworkAutoGraderPanel
          homeworkId={item.id}
          hasSubmissionText={Boolean(item.submission_text?.trim())}
          gradings={item.ai_gradings ?? []}
        />
      )}

      <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--color-muted)]">
            Comments
          </h2>
          {parentCommentCount > 0 && (
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
              {parentCommentCount} parent comment{parentCommentCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
        {parentCommentCount > 0 && (
          <p className="mb-4 text-sm text-[var(--color-muted)]">
            Parent feedback on this assignment is shown below, including notes
            left before the student submits.
          </p>
        )}
        <TutorCommentList
          comments={homeworkComments}
          studentId={item.student_id}
          currentUserId={currentUserId}
          replyAs="admin"
          showTopLevelComposer={homeworkComments.length === 0}
          homeworkAssignmentId={item.id}
          useReplyLabelsForComposer
        />
      </section>

      <HomeworkAssignmentAdminActions item={item} />
    </div>
  );
}

export function AdminHomeworkList({
  items,
  comments = [],
}: {
  items: (ResolvedHomework & { students?: { display_name: string } | null })[];
  comments?: TutorComment[];
}) {
  if (items.length === 0) {
    return <div className="empty-state">No homework assigned yet.</div>;
  }

  return (
    <ul className="divide-y divide-[var(--color-border)]">
      {items.map((item) => {
        const studentName = item.students?.display_name ?? "Student";
        const hasSubmission =
          Boolean(item.submission_text) || item.resolved_status === "completed";
        const homeworkComments = getHomeworkComments(comments, item.id);
        const parentCommentCount = countParentHomeworkComments(comments, item.id);

        return (
          <li key={item.id} className="py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/admin/homework/${item.id}`}
                  className="font-medium text-slate-800 hover:text-[var(--color-primary)]"
                >
                  {item.title}
                </Link>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {studentName} ·{" "}
                  <span className="capitalize">{item.resolved_status}</span>
                  {item.due_date ? ` · due ${item.due_date}` : ""}
                  {parentCommentCount > 0
                    ? ` · ${parentCommentCount} parent comment${parentCommentCount === 1 ? "" : "s"}`
                    : homeworkComments.length > 0
                      ? ` · ${homeworkComments.length} comment${homeworkComments.length === 1 ? "" : "s"}`
                      : ""}
                </p>
              </div>
              {(hasSubmission || homeworkComments.length > 0) && (
                <Link
                  href={`/admin/homework/${item.id}`}
                  className="shrink-0 text-sm text-[var(--color-accent)]"
                >
                  {hasSubmission
                    ? item.ai_gradings?.length
                      ? `Review · ${item.ai_gradings.length} AI grade${item.ai_gradings.length === 1 ? "" : "s"} →`
                      : parentCommentCount > 0
                        ? "View submission & parent comments →"
                        : "View submission →"
                    : "View parent comments →"}
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminHomeworkSubmissions({
  items,
  comments,
}: {
  items: ResolvedHomework[];
  comments: TutorComment[];
}) {
  const reviewItems = items.filter((item) =>
    homeworkHasReviewActivity(item, comments, item.id)
  );

  if (reviewItems.length === 0) {
    return (
      <div className="empty-state">
        No homework submissions or parent comments yet.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {reviewItems.map((item) => {
        const homeworkComments = getHomeworkComments(comments, item.id);
        const parentCommentCount = countParentHomeworkComments(comments, item.id);
        const hasSubmission =
          Boolean(item.submission_text) || item.resolved_status === "completed";
        const latestParentComment = homeworkComments
          .filter((comment) => comment.profiles?.role === "parent")
          .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

        return (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] p-3"
          >
            <div className="min-w-0">
              <Link
                href={`/admin/homework/${item.id}`}
                className="font-medium text-slate-800 hover:text-[var(--color-primary)]"
              >
                {item.title}
              </Link>
              <p className="mt-1 text-xs text-[var(--color-muted)] capitalize">
                {item.resolved_status}
                {item.completed_at ? (
                  <>
                    {" · submitted "}
                    <DisplayDateTime iso={item.completed_at} variant="datetime" />
                  </>
                ) : parentCommentCount > 0 ? (
                  " · parent feedback"
                ) : null}
                {parentCommentCount > 0
                  ? ` · ${parentCommentCount} parent comment${parentCommentCount === 1 ? "" : "s"}`
                  : homeworkComments.length > 0
                    ? ` · ${homeworkComments.length} comment${homeworkComments.length === 1 ? "" : "s"}`
                    : ""}
              </p>
              {latestParentComment && (
                <p className="mt-2 line-clamp-2 text-sm text-slate-700">
                  <span className="font-medium text-violet-700">Parent: </span>
                  {latestParentComment.comment}
                </p>
              )}
            </div>
            <Link
              href={`/admin/homework/${item.id}`}
              className="shrink-0 text-sm text-[var(--color-accent)]"
            >
              {hasSubmission ? "Review →" : "View comments →"}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
