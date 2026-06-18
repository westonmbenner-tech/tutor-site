"use client";

import { useTimezoneSelector } from "@/components/timezone/TimezoneProvider";

export function TimezoneSelector() {
  const { timezone, setTimezone, options } = useTimezoneSelector();

  return (
    <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
      <span className="hidden sm:inline">Time zone</span>
      <select
        value={timezone}
        onChange={(event) => setTimezone(event.target.value as typeof timezone)}
        className="!w-auto rounded-lg border border-[var(--color-border)] bg-white px-2 py-1.5 text-sm text-slate-700"
        aria-label="Display time zone"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
