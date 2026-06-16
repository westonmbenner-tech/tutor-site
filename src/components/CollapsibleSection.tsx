"use client";

import { useState } from "react";

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`rounded-xl border border-[var(--color-border)] bg-slate-50/40 ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-slate-800">{title}</span>
        <span className="text-xs text-[var(--color-muted)]">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="border-t border-[var(--color-border)] bg-white px-4 py-4">
          {children}
        </div>
      )}
    </div>
  );
}
