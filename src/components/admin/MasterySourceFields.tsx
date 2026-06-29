"use client";

import { useState } from "react";

type MasterySourceType = "text" | "url";

export function MasterySourceFields({
  defaultMandate = false,
  defaultSourceType = "text" as MasterySourceType,
  defaultSourceText = "",
  defaultSourceUrl = "",
  idPrefix = "",
}: {
  defaultMandate?: boolean;
  defaultSourceType?: MasterySourceType;
  defaultSourceText?: string;
  defaultSourceUrl?: string;
  idPrefix?: string;
}) {
  const [mandate, setMandate] = useState(defaultMandate);
  const [sourceType, setSourceType] = useState<MasterySourceType>(defaultSourceType);

  return (
    <div className="space-y-4 rounded-lg border border-[var(--color-border)] bg-slate-50/60 p-4">
      <label className="flex items-start gap-2 text-sm text-slate-800">
        <input
          type="checkbox"
          name="mandate_ai_mastery"
          checked={mandate}
          onChange={(event) => setMandate(event.target.checked)}
          className="mt-1"
        />
        <span>
          <span className="font-medium">Mandate AI chatbot</span>
          <span className="mt-1 block text-[var(--color-muted)]">
            Student must pass an AI mastery check (~80% on 10–15 questions)
            before submitting homework.
          </span>
        </span>
      </label>

      {mandate && (
        <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-800">
              Study material for AI questions
            </legend>
            <label className="mr-4 inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="mastery_source_type"
                value="text"
                checked={sourceType === "text"}
                onChange={() => setSourceType("text")}
              />
              Paste text
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="mastery_source_type"
                value="url"
                checked={sourceType === "url"}
                onChange={() => setSourceType("url")}
              />
              Link to website
            </label>
          </fieldset>

          {sourceType === "text" ? (
            <div className="form-group mb-0">
              <label
                className="label"
                htmlFor={`${idPrefix}mastery-source-text`}
              >
                Chapter / study text
              </label>
              <textarea
                id={`${idPrefix}mastery-source-text`}
                name="mastery_source_text"
                rows={6}
                defaultValue={defaultSourceText}
                placeholder="Paste the chapter, notes, or worksheet text the AI should use…"
              />
            </div>
          ) : (
            <div className="form-group mb-0">
              <label className="label" htmlFor={`${idPrefix}mastery-source-url`}>
                Study material URL
              </label>
              <input
                id={`${idPrefix}mastery-source-url`}
                name="mastery_source_url"
                type="url"
                defaultValue={defaultSourceUrl}
                placeholder="https://example.com/chapter-notes"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
