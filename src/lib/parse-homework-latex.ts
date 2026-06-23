function normalizeMultilineText(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

export type HomeworkDescriptionFormat = "plain" | "latex";

export type LatexSegment =
  | { kind: "text"; value: string }
  | { kind: "inline"; value: string }
  | { kind: "block"; value: string };

const LATEX_DELIMITERS = ["$$", "\\[", "\\(", "$"] as const;

function findNextDelimiter(text: string, from: number): number {
  let next = text.length;

  for (const delimiter of LATEX_DELIMITERS) {
    const index = text.indexOf(delimiter, from);
    if (index !== -1 && index < next) {
      next = index;
    }
  }

  return next;
}

export function parseHomeworkLatex(text: string): LatexSegment[] {
  const normalized = normalizeMultilineText(text);
  const segments: LatexSegment[] = [];
  let index = 0;

  while (index < normalized.length) {
    if (normalized.startsWith("$$", index)) {
      const end = normalized.indexOf("$$", index + 2);
      if (end !== -1) {
        segments.push({ kind: "block", value: normalized.slice(index + 2, end) });
        index = end + 2;
        continue;
      }
    }

    if (normalized.startsWith("\\[", index)) {
      const end = normalized.indexOf("\\]", index + 2);
      if (end !== -1) {
        segments.push({ kind: "block", value: normalized.slice(index + 2, end) });
        index = end + 2;
        continue;
      }
    }

    if (normalized.startsWith("\\(", index)) {
      const end = normalized.indexOf("\\)", index + 2);
      if (end !== -1) {
        segments.push({ kind: "inline", value: normalized.slice(index + 2, end) });
        index = end + 2;
        continue;
      }
    }

    if (normalized[index] === "$" && normalized[index + 1] !== "$") {
      const end = normalized.indexOf("$", index + 1);
      if (end !== -1) {
        segments.push({ kind: "inline", value: normalized.slice(index + 1, end) });
        index = end + 1;
        continue;
      }
    }

    const nextDelimiter = findNextDelimiter(normalized, index);
    const chunk = normalized.slice(index, nextDelimiter);
    if (chunk) {
      segments.push({ kind: "text", value: chunk });
    }
    index = nextDelimiter;
  }

  return segments;
}

export function normalizeHomeworkDescriptionFormat(
  value: unknown
): HomeworkDescriptionFormat {
  return value === "latex" ? "latex" : "plain";
}
