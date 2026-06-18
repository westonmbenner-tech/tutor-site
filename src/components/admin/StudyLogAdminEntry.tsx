import type { ReactNode } from "react";
import type { StudyLog } from "@/lib/types";

export function StudyLogAdminEntry({
  log,
  children,
}: {
  log: StudyLog;
  children?: ReactNode;
}) {
  const noteSections = [
    { label: "Student notes", value: log.miscellaneous_notes },
    { label: "Errors & lessons learned", value: log.errors_lessons_learned },
  ].filter((section) => section.value?.trim());

  return (
    <li className="rounded-lg border border-[var(--color-border)] p-3 text-sm">
      <p className="font-medium text-slate-800">{log.log_date}</p>
      <p className="text-[var(--color-muted)]">
        {log.questions_completed} questions
        {log.questions_correct > 0 || log.questions_wrong > 0
          ? ` · ${log.questions_correct} correct · ${log.questions_wrong} wrong`
          : ""}
        {" · "}
        {log.topic?.trim() || "No topic"}
        {log.confidence != null ? ` · Confidence ${log.confidence}/5` : ""}
      </p>

      {noteSections.length > 0 ? (
        <div className="mt-3 space-y-3 rounded-lg bg-slate-50 px-3 py-2">
          {noteSections.map((section) => (
            <div key={section.label}>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                {section.label}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-slate-700">
                {section.value}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-[var(--color-muted)]">No student notes.</p>
      )}

      {children ? <div className="mt-3">{children}</div> : null}
    </li>
  );
}
