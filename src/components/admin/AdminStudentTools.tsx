"use client";

import { useActionState, useState } from "react";
import { applyStreakFreeze } from "@/app/actions/homework";
import { generateParentSummaryAction } from "@/app/actions/admin";
import { ParentSummaryExport } from "@/components/ParentSummaryExport";
import type { Parent } from "@/lib/types";

const freezeInitial = { error: null as string | null, success: false };

export function AdminStudentTools({
  studentId,
  studentName,
  parents,
}: {
  studentId: string;
  studentName: string;
  parents: Parent[];
}) {
  const [freezeState, freezeAction, freezePending] = useActionState(
    applyStreakFreeze,
    freezeInitial
  );
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  async function handleExport() {
    setLoadingSummary(true);
    setSummaryError(null);
    const result = await generateParentSummaryAction(
      studentId,
      startDate,
      endDate
    );
    setLoadingSummary(false);
    if (result.error) setSummaryError(result.error);
    else setSummary(result.markdown);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[var(--color-border)] p-4">
        <h3 className="font-medium text-slate-800">Apply streak freeze</h3>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Uses one of the student&apos;s streak freeze credits.
        </p>
        <form action={freezeAction} className="mt-3 space-y-3">
          <input type="hidden" name="student_id" value={studentId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="freeze_date">
                Date
              </label>
              <input id="freeze_date" name="freeze_date" type="date" required />
            </div>
            <div>
              <label className="label" htmlFor="reason">
                Reason
              </label>
              <input id="reason" name="reason" type="text" placeholder="Excused absence" />
            </div>
          </div>
          {freezeState.error && (
            <p className="text-sm text-[var(--color-danger)]">{freezeState.error}</p>
          )}
          {freezeState.success && (
            <p className="text-sm text-[var(--color-primary)]">Freeze applied.</p>
          )}
          <button
            type="submit"
            disabled={freezePending}
            className="btn btn-secondary text-sm"
          >
            Apply freeze
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] p-4">
        <h3 className="font-medium text-slate-800">Export parent summary</h3>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="label">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={loadingSummary}
            className="btn btn-primary text-sm"
          >
            {loadingSummary ? "Generating…" : "Generate summary"}
          </button>
        </div>
        {summaryError && (
          <p className="mt-2 text-sm text-[var(--color-danger)]">{summaryError}</p>
        )}
        {summary && (
          <div className="mt-4">
            <ParentSummaryExport
              summaryMarkdown={summary}
              studentName={studentName}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function LinkParentForm({
  studentId,
  parents,
}: {
  studentId: string;
  parents: Parent[];
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof freezeInitial, formData: FormData) => {
      const { linkParentToStudent } = await import("@/app/actions/admin");
      return linkParentToStudent(_prev, formData);
    },
    freezeInitial
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="student_id" value={studentId} />
      <div>
        <label className="label" htmlFor="parent_id">
          Link parent
        </label>
        <select id="parent_id" name="parent_id" required defaultValue="">
          <option value="" disabled>
            Select parent
          </option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={pending} className="btn btn-secondary text-sm">
        Link
      </button>
      {state.error && (
        <p className="w-full text-sm text-[var(--color-danger)]">{state.error}</p>
      )}
      {state.success && (
        <p className="w-full text-sm text-[var(--color-primary)]">Linked.</p>
      )}
    </form>
  );
}
