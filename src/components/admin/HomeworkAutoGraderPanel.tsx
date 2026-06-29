"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GradingResultCard } from "@/components/HomeworkAiGradingHistory";
import type { HomeworkAiGrading } from "@/lib/types";

type SourceType = "image" | "url" | "text";

export function HomeworkAutoGraderPanel({
  homeworkId,
  hasSubmissionText,
  gradings,
}: {
  homeworkId: string;
  hasSubmissionText: boolean;
  gradings: HomeworkAiGrading[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sourceType, setSourceType] = useState<SourceType>("text");
  const [questionUrl, setQuestionUrl] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedGradings = useMemo(
    () =>
      [...gradings].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [gradings]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("homework_id", homeworkId);
      formData.set("source_type", sourceType);

      if (sourceType === "url") {
        formData.set("question_url", questionUrl.trim());
      } else if (sourceType === "text") {
        formData.set("question_text", questionText.trim());
      } else {
        const input = event.currentTarget.elements.namedItem(
          "question_images"
        ) as HTMLInputElement | null;

        if (!input?.files?.length) {
          throw new Error("Upload at least one question image.");
        }

        Array.from(input.files).forEach((file) => {
          formData.append("question_images", file);
        });
      }

      const response = await fetch("/api/ai/homework-grade", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Auto grading failed.");
      }

      setOpen(false);
      setQuestionUrl("");
      setQuestionText("");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Auto grading failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--color-muted)]">
            AI auto grading
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Compare the student submission against pasted question text, a question
            link, or uploaded images. Each run is saved separately for resubmissions.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary text-sm"
          disabled={!hasSubmissionText}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close grader" : "Auto grade"}
        </button>
      </div>

      {!hasSubmissionText && (
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          Auto grading requires a written student submission.
        </p>
      )}

      {open && hasSubmissionText && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t border-[var(--color-border)] pt-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-800">
              Question source
            </legend>
            <label className="mr-4 inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="source_type"
                value="text"
                checked={sourceType === "text"}
                onChange={() => setSourceType("text")}
              />
              Paste question text
            </label>
            <label className="mr-4 inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="source_type"
                value="url"
                checked={sourceType === "url"}
                onChange={() => setSourceType("url")}
              />
              Link to questions
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="source_type"
                value="image"
                checked={sourceType === "image"}
                onChange={() => setSourceType("image")}
              />
              Upload question image(s)
            </label>
          </fieldset>

          {sourceType === "text" ? (
            <div className="form-group mb-0">
              <label className="label" htmlFor="question-text">
                Questions and answer key
              </label>
              <textarea
                id="question-text"
                value={questionText}
                onChange={(event) => setQuestionText(event.target.value)}
                rows={8}
                required
                placeholder="Paste the worksheet questions here. Include correct answers if you have them."
              />
            </div>
          ) : sourceType === "url" ? (
            <div className="form-group mb-0">
              <label className="label" htmlFor="question-url">
                Question page URL
              </label>
              <input
                id="question-url"
                type="url"
                value={questionUrl}
                onChange={(event) => setQuestionUrl(event.target.value)}
                placeholder="https://example.com/worksheet"
                required
              />
            </div>
          ) : (
            <div className="form-group mb-0">
              <label className="label" htmlFor="question-images">
                Question images
              </label>
              <input
                id="question-images"
                name="question_images"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                required
              />
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Up to 5 images, 5 MB each.
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-[var(--color-danger)]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-secondary text-sm"
          >
            {loading ? "Grading with AI…" : "Run auto grade"}
          </button>
        </form>
      )}

      {sortedGradings.length > 0 && (
        <div className="mt-5 space-y-3 border-t border-[var(--color-border)] pt-4">
          <h3 className="text-sm font-medium text-slate-800">
            Grading history ({sortedGradings.length})
          </h3>
          <ul className="space-y-2">
            {sortedGradings.map((grading) => (
              <li key={grading.id}>
                <GradingResultCard grading={grading} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
