import type { Mistake, MistakeLabel } from "@/lib/types";

export const UNCategorized_LABEL_FILTER = "__uncategorized__";

export interface LabelFilterOption {
  id: string;
  name: string;
  count: number;
}

export function getMistakeLabelName(mistake: Mistake): string {
  return mistake.mistake_labels?.name ?? "Uncategorized";
}

export function filterMistakesByLabel(
  mistakes: Mistake[],
  labelFilter: string | null
): Mistake[] {
  if (!labelFilter) return mistakes;

  if (labelFilter === UNCategorized_LABEL_FILTER) {
    return mistakes.filter((mistake) => !mistake.mistake_label_id);
  }

  return mistakes.filter((mistake) => mistake.mistake_label_id === labelFilter);
}

export function buildLabelFilterOptions(
  labels: MistakeLabel[],
  mistakes: Mistake[]
): LabelFilterOption[] {
  const counts = new Map<string, number>();

  for (const mistake of mistakes) {
    const key = mistake.mistake_label_id ?? UNCategorized_LABEL_FILTER;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const options: LabelFilterOption[] = labels
    .map((label) => ({
      id: label.id,
      name: label.name,
      count: counts.get(label.id) ?? 0,
    }))
    .filter((option) => option.count > 0);

  const uncategorizedCount = counts.get(UNCategorized_LABEL_FILTER) ?? 0;
  if (uncategorizedCount > 0) {
    options.push({
      id: UNCategorized_LABEL_FILTER,
      name: "Uncategorized",
      count: uncategorizedCount,
    });
  }

  return options.sort((a, b) => a.name.localeCompare(b.name));
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function mistakesToCsv(mistakes: Mistake[]): string {
  const headers = [
    "Date",
    "Topic",
    "Label",
    "Question",
    "Explanation",
    "Lesson learned",
  ];

  const rows = mistakes.map((mistake) =>
    [
      mistake.mistake_date,
      mistake.topic ?? "",
      getMistakeLabelName(mistake),
      mistake.question_prompt ?? "",
      mistake.explanation ?? "",
      mistake.lesson_learned ?? "",
    ]
      .map((field) => escapeCsvField(field))
      .join(",")
  );

  return [headers.join(","), ...rows].join("\r\n");
}

export function sanitizeCsvFilename(name: string): string {
  return name.replace(/[^\w\-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function downloadMistakesCsv(mistakes: Mistake[], filenameBase: string) {
  const csv = mistakesToCsv(mistakes);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeCsvFilename(filenameBase)}-mistakes.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
