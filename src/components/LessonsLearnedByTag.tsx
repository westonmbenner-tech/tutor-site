import type { Mistake } from "@/lib/types";

function groupLessonsByTag(mistakes: Mistake[]) {
  const groups = new Map<
    string,
    { label: string; items: { lesson: string; date: string; topic: string | null }[] }
  >();

  for (const mistake of mistakes) {
    const lesson = mistake.lesson_learned?.trim();
    if (!lesson) continue;

    const label =
      (mistake.mistake_labels as { name?: string } | null)?.name ?? "Uncategorized";

    const existing = groups.get(label) ?? { label, items: [] };
    existing.items.push({
      lesson,
      date: mistake.mistake_date,
      topic: mistake.topic,
    });
    groups.set(label, existing);
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
}

export function LessonsLearnedByTag({ mistakes }: { mistakes: Mistake[] }) {
  const groups = groupLessonsByTag(mistakes);

  if (groups.length === 0) {
    return (
      <div className="empty-state">
        No lessons learned yet. Add mistakes with a lesson to see them here.
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {groups.map((group) => (
        <li
          key={group.label}
          className="rounded-lg border border-[var(--color-border)] bg-slate-50/50 p-4"
        >
          <span className="inline-block rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700">
            {group.label}
          </span>
          <ul className="mt-3 space-y-2">
            {group.items.map((item, index) => (
              <li key={`${group.label}-${index}`} className="text-sm">
                <p className="text-[var(--color-primary)]">{item.lesson}</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {item.date}
                  {item.topic ? ` · ${item.topic}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
