"use client";

import { completeHomework } from "@/app/actions/homework";
import type { HomeworkAssignment } from "@/lib/types";

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
}: {
  items: ResolvedHomework[];
  showCompleteButton?: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="empty-state">No homework assignments to show.</div>
    );
  }

  return (
    <ul className="divide-y divide-[var(--color-border)]">
      {items.map((item) => (
        <li key={item.id} className="py-4 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium text-slate-800">{item.title}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[item.resolved_status]}`}
                >
                  {item.resolved_status}
                </span>
              </div>
              {item.description && (
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {item.description}
                </p>
              )}
              {item.due_date && (
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Due {item.due_date}
                </p>
              )}
              {Array.isArray(item.links) && item.links.length > 0 && (
                <ul className="mt-2 space-y-1">
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
            {showCompleteButton && item.resolved_status !== "completed" && (
              <form action={completeHomework.bind(null, item.id)}>
                <button type="submit" className="btn btn-secondary text-sm">
                  Mark complete
                </button>
              </form>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
