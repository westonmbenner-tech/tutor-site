"use client";

import { useState } from "react";
import { MistakeForm } from "@/components/MistakeForm";
import type { MistakeLabel } from "@/lib/types";

export function CollapsibleMistakeForm({
  studentId,
  labels,
  studyLogId,
  wrongCount,
}: {
  studentId: string;
  labels: MistakeLabel[];
  studyLogId?: string | null;
  wrongCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const title =
    wrongCount && wrongCount > 0
      ? `Record ${wrongCount} mistake${wrongCount === 1 ? "" : "s"}`
      : "Record mistakes";

  return (
    <div>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn btn-secondary text-sm"
        >
          Add mistake
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-800">{title}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-[var(--color-muted)] hover:text-slate-800"
            >
              Close
            </button>
          </div>
          <MistakeForm
            studentId={studentId}
            labels={labels}
            studyLogId={studyLogId}
          />
        </div>
      )}
    </div>
  );
}
