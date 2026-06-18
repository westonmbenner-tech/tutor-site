export type DisplayTimezone = "PST" | "CST" | "EST";

export const DEFAULT_DISPLAY_TIMEZONE: DisplayTimezone = "PST";

export const DISPLAY_TIMEZONE_OPTIONS: {
  value: DisplayTimezone;
  label: string;
}[] = [
  { value: "PST", label: "PST" },
  { value: "CST", label: "CST" },
  { value: "EST", label: "EST" },
];

/** Hours to add to UTC for display only (standard-time offsets). */
const OFFSET_HOURS: Record<DisplayTimezone, number> = {
  PST: -8,
  CST: -6,
  EST: -5,
};

export const TIMEZONE_COOKIE = "tc_display_tz";
export const TIMEZONE_STORAGE_KEY = "tc_display_tz";

export function isDisplayTimezone(value: string | null | undefined): value is DisplayTimezone {
  return value === "PST" || value === "CST" || value === "EST";
}

function shiftUtcToDisplay(iso: string, timezone: DisplayTimezone): Date {
  const utc = new Date(iso);
  if (Number.isNaN(utc.getTime())) {
    return utc;
  }

  return new Date(utc.getTime() + OFFSET_HOURS[timezone] * 60 * 60 * 1000);
}

function formatShiftedUtc(
  shifted: Date,
  timezone: DisplayTimezone,
  includeTime: boolean
): string {
  if (Number.isNaN(shifted.getTime())) {
    return "—";
  }

  const datePart = shifted.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  if (!includeTime) {
    return `${datePart} ${timezone}`;
  }

  const timePart = shifted.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });

  return `${datePart}, ${timePart} ${timezone}`;
}

export function formatDisplayDateTime(
  iso: string,
  timezone: DisplayTimezone = DEFAULT_DISPLAY_TIMEZONE
): string {
  return formatShiftedUtc(shiftUtcToDisplay(iso, timezone), timezone, true);
}

export function formatDisplayDate(
  iso: string,
  timezone: DisplayTimezone = DEFAULT_DISPLAY_TIMEZONE
): string {
  return formatShiftedUtc(shiftUtcToDisplay(iso, timezone), timezone, false);
}
