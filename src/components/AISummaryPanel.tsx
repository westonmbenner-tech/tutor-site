"use client";

import { useState } from "react";
import { DisplayDateTime } from "@/components/timezone/DisplayDateTime";
import type { AIMistakeSummary } from "@/lib/types";

export function AISummaryPanel({
  studentId,
  summaries,
}: {
  studentId: string;
  summaries: AIMistakeSummary[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  async function requestSummary() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/mistake-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          start_date: startDate,
          end_date: endDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-primary-light)]/30 p-4">
        <p className="text-sm text-slate-700">
          <strong>Your labels</strong> capture your own reflection when you tag
          mistakes. <strong>AI grouping</strong> is a second pass — it finds
          patterns across your tags and notes, without replacing them.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="ai_start">
            From
          </label>
          <input
            id="ai_start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="ai_end">
            To
          </label>
          <input
            id="ai_end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={requestSummary}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? "Analyzing…" : "Analyze mistake patterns"}
        </button>
      </div>

      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

      {summaries.length === 0 ? (
        <div className="empty-state">No AI summaries yet. Run an analysis above.</div>
      ) : (
        <div className="space-y-6">
          {summaries.map((s) => (
            <article
              key={s.id}
              className="rounded-xl border border-[var(--color-border)] bg-white p-5"
            >
              <p className="text-xs text-[var(--color-muted)]">
                {s.generated_for_start_date} → {s.generated_for_end_date} ·{" "}
                <DisplayDateTime iso={s.created_at} variant="datetime" />
              </p>
              {s.summary && (
                <p className="mt-3 text-sm text-slate-700">{s.summary}</p>
              )}
              {s.weak_areas?.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-slate-800">Weak areas</h4>
                  <ul className="mt-2 space-y-2">
                    {s.weak_areas.map((w, i) => (
                      <li key={i} className="text-sm text-slate-600">
                        <span className="font-medium capitalize">{w.priority}</span>:{" "}
                        {w.area} — {w.evidence}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {s.grouped_categories?.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-slate-800">
                    Grouped categories
                  </h4>
                  <ul className="mt-2 space-y-3">
                    {s.grouped_categories.map((g, i) => (
                      <li
                        key={i}
                        className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600"
                      >
                        <p className="font-medium text-slate-800">
                          {g.category} ({g.mistake_count})
                        </p>
                        <p className="mt-1">{g.suggestion}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {s.suggested_next_steps && (
                <p className="mt-4 text-sm text-[var(--color-primary)]">
                  Next steps: {s.suggested_next_steps}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
