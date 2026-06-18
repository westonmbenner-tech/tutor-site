"use client";

import { useDisplayTimezone } from "@/components/timezone/TimezoneProvider";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/timezone";

export function DisplayDateTime({
  iso,
  variant = "datetime",
  className,
}: {
  iso: string;
  variant?: "datetime" | "date";
  className?: string;
}) {
  const timezone = useDisplayTimezone();
  const label =
    variant === "date"
      ? formatDisplayDate(iso, timezone)
      : formatDisplayDateTime(iso, timezone);

  return (
    <time dateTime={iso} className={className}>
      {label}
    </time>
  );
}
