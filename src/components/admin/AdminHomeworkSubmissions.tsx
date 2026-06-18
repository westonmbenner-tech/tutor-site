import Link from "next/link";
import { TutorCommentList } from "@/components/TutorCommentBox";
import { DisplayDateTime } from "@/components/timezone/DisplayDateTime";
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
          <p className="mt-3 text-sm text-slate-700">{item.description}</p>
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
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
            {item.submission_text}
          </p>
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

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-[var(--color-muted)]">
          Tutor feedback
        </h2>
        <TutorCommentList
          comments={comments}
          studentId={item.student_id}
          currentUserId={currentUserId}
          replyAs="admin"
          showTopLevelComposer
          homeworkAssignmentId={item.id}
        />
      </section>
    </div>
  );
}

export function AdminHomeworkList({
  items,
}: {
  items: (ResolvedHomework & { students?: { display_name: string } | null })[];
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
                </p>
              </div>
              {hasSubmission && (
                <Link
                  href={`/admin/homework/${item.id}`}
                  className="shrink-0 text-sm text-[var(--color-accent)]"
                >
                  View submission →
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
  const withSubmissions = items.filter(
    (item) => item.submission_text || item.resolved_status === "completed"
  );

  if (withSubmissions.length === 0) {
    return <div className="empty-state">No homework submissions yet.</div>;
  }

  return (
    <ul className="space-y-3">
      {withSubmissions.map((item) => {
        const homeworkComments = comments.filter(
          (comment) => comment.homework_assignment_id === item.id
        );

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
                ) : null}
                {homeworkComments.length > 0
                  ? ` · ${homeworkComments.length} comment${homeworkComments.length === 1 ? "" : "s"}`
                  : ""}
              </p>
            </div>
            <Link
              href={`/admin/homework/${item.id}`}
              className="shrink-0 text-sm text-[var(--color-accent)]"
            >
              Review →
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
