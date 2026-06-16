"use client";

import { useActionState } from "react";
import { useStudentStreakFreeze } from "@/app/actions/homework";
import { formatDateISO } from "@/lib/streak";

const initialState = { error: null as string | null, success: false };

export function UseStreakFreezeForm({
  studentId,
  balance,
}: {
  studentId: string;
  balance: number;
}) {
  const boundAction = useStudentStreakFreeze.bind(null, studentId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const today = formatDateISO(new Date());

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-[var(--color-border)] bg-slate-50 p-4">
      <p className="text-sm text-slate-700">
        <span className="font-medium">{balance}</span> streak freeze
        {balance === 1 ? "" : "s"} remaining
      </p>
      {balance > 0 ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="form-group mb-0">
              <label className="label" htmlFor="freeze_date">
                Excuse this date
              </label>
              <input
                id="freeze_date"
                name="freeze_date"
                type="date"
                max={today}
                required
              />
            </div>
            <div className="form-group mb-0">
              <label className="label" htmlFor="reason">
                Note (optional)
              </label>
              <input
                id="reason"
                name="reason"
                type="text"
                placeholder="e.g. Sick day"
              />
            </div>
          </div>
          {state.error && (
            <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
          )}
          {state.success && (
            <p className="text-sm text-[var(--color-primary)]">Streak freeze applied.</p>
          )}
          <button type="submit" disabled={pending} className="btn btn-secondary text-sm">
            {pending ? "Applying…" : "Use streak freeze"}
          </button>
        </>
      ) : (
        <p className="text-sm text-[var(--color-muted)]">
          You have used all of your streak freezes. Ask your tutor if you need more.
        </p>
      )}
    </form>
  );
}
