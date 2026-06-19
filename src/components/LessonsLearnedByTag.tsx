import type { Mistake } from "@/lib/types";
import {
  UNCategorized_LABEL_FILTER,
  getMistakeLabelName,
} from "@/lib/mistakes-utils";

function groupLessonsByTag(mistakes: Mistake[]) {
  const groups = new Map<
    string,
    {
      label: string;
      labelFilterId: string;
      items: { lesson: string; date: string; topic: string | null }[];
    }
  >();

  for (const mistake of mistakes) {
    const lesson = mistake.lesson_learned?.trim();
    if (!lesson) continue;

    const label = getMistakeLabelName(mistake);
    const labelFilterId = mistake.mistake_label_id ?? UNCategorized_LABEL_FILTER;

    const existing = groups.get(labelFilterId) ?? {
      label,
      labelFilterId,
      items: [],
    };
    existing.items.push({
      lesson,
      date: mistake.mistake_date,
      topic: mistake.topic,
    });
    groups.set(labelFilterId, existing);
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
}

export function LessonsLearnedByTag({
  mistakes,
  selectedLabelFilter = null,
  onLabelSelect,
}: {
  mistakes: Mistake[];
  selectedLabelFilter?: string | null;
  onLabelSelect?: (labelFilter: string) => void;
}) {
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
      {groups.map((group) => {
        const isSelected = selectedLabelFilter === group.labelFilterId;
        const labelClass = onLabelSelect
          ? `inline-block rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              isSelected
                ? "bg-[var(--color-primary)] text-white"
                : "bg-white text-slate-700 hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
            }`
          : "inline-block rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700";

        return (
          <li
            key={group.labelFilterId}
            className="rounded-lg border border-[var(--color-border)] bg-slate-50/50 p-4"
          >
            {onLabelSelect ? (
              <button
                type="button"
                onClick={() => onLabelSelect(group.labelFilterId)}
                className={labelClass}
              >
                {group.label}
              </button>
            ) : (
              <span className={labelClass}>{group.label}</span>
            )}
            <ul className="mt-3 space-y-2">
              {group.items.map((item, index) => (
                <li key={`${group.labelFilterId}-${index}`} className="text-sm">
                  <p className="text-[var(--color-primary)]">{item.lesson}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {item.date}
                    {item.topic ? ` · ${item.topic}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
