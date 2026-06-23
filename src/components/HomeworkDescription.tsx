"use client";

import katex from "katex";
import { FormattedMultilineText } from "@/components/FormattedMultilineText";
import {
  parseHomeworkLatex,
  type HomeworkDescriptionFormat,
} from "@/lib/parse-homework-latex";
import "katex/dist/katex.min.css";

function renderKatex(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex.trim(), {
      throwOnError: false,
      displayMode,
      output: "html",
    });
  } catch {
    return latex;
  }
}

function LatexDescription({ text, className }: { text: string; className?: string }) {
  const segments = parseHomeworkLatex(text);

  return (
    <div className={`break-words leading-relaxed ${className ?? ""}`.trim()}>
      {segments.map((segment, index) => {
        if (segment.kind === "text") {
          return (
            <span key={index} className="whitespace-pre-wrap">
              {segment.value}
            </span>
          );
        }

        const html = renderKatex(
          segment.value,
          segment.kind === "block"
        );

        if (segment.kind === "block") {
          return (
            <div
              key={index}
              className="my-2 overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        return (
          <span
            key={index}
            className="inline-block align-middle"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </div>
  );
}

export function HomeworkDescription({
  text,
  format = "plain",
  className = "",
}: {
  text: string;
  format?: HomeworkDescriptionFormat;
  className?: string;
}) {
  if (format === "latex") {
    return <LatexDescription text={text} className={className} />;
  }

  return <FormattedMultilineText text={text} className={className} />;
}

export function HomeworkDescriptionPreview({
  description,
  selectedFormat,
  onFormatChange,
}: {
  description: string;
  selectedFormat: HomeworkDescriptionFormat;
  onFormatChange: (format: HomeworkDescriptionFormat) => void;
}) {
  const trimmed = description.trim();

  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="label mb-1 block">
          Display to student and parent as
        </legend>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name="description_format"
            value="plain"
            checked={selectedFormat === "plain"}
            onChange={() => onFormatChange("plain")}
          />
          Plain text
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name="description_format"
            value="latex"
            checked={selectedFormat === "latex"}
            onChange={() => onFormatChange("latex")}
          />
          LaTeX (inline <code className="text-xs">$…$</code>, block{" "}
          <code className="text-xs">$$…$$</code>)
        </label>
      </fieldset>

      {trimmed ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--color-border)] bg-slate-50/70 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
              Plain text preview
            </p>
            <HomeworkDescription
              text={description}
              format="plain"
              className="mt-2 text-sm text-slate-700"
            />
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-slate-50/70 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
              LaTeX preview
            </p>
            <HomeworkDescription
              text={description}
              format="latex"
              className="mt-2 text-sm text-slate-700"
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-muted)]">
          Enter a description above to preview both formats.
        </p>
      )}
    </div>
  );
}
