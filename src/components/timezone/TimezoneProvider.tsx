"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_DISPLAY_TIMEZONE,
  DISPLAY_TIMEZONE_OPTIONS,
  TIMEZONE_COOKIE,
  TIMEZONE_STORAGE_KEY,
  isDisplayTimezone,
  type DisplayTimezone,
} from "@/lib/timezone";

interface TimezoneContextValue {
  timezone: DisplayTimezone;
  setTimezone: (timezone: DisplayTimezone) => void;
}

const TimezoneContext = createContext<TimezoneContextValue | null>(null);

function readCookieTimezone(): DisplayTimezone | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${TIMEZONE_COOKIE}=`));

  if (!match) return null;

  const value = decodeURIComponent(match.split("=")[1] ?? "");
  return isDisplayTimezone(value) ? value : null;
}

function readStoredTimezone(): DisplayTimezone {
  if (typeof window === "undefined") {
    return DEFAULT_DISPLAY_TIMEZONE;
  }

  const fromStorage = localStorage.getItem(TIMEZONE_STORAGE_KEY);
  if (isDisplayTimezone(fromStorage)) {
    return fromStorage;
  }

  return readCookieTimezone() ?? DEFAULT_DISPLAY_TIMEZONE;
}

function persistTimezone(timezone: DisplayTimezone) {
  localStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);
  document.cookie = `${TIMEZONE_COOKIE}=${timezone};path=/;max-age=31536000;samesite=lax`;
}

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const [timezone, setTimezoneState] = useState<DisplayTimezone>(readStoredTimezone);

  const setTimezone = useCallback((next: DisplayTimezone) => {
    setTimezoneState(next);
    persistTimezone(next);
  }, []);

  const value = useMemo(
    () => ({ timezone, setTimezone }),
    [timezone, setTimezone]
  );

  return (
    <TimezoneContext.Provider value={value}>{children}</TimezoneContext.Provider>
  );
}

export function useDisplayTimezone(): DisplayTimezone {
  const context = useContext(TimezoneContext);
  return context?.timezone ?? DEFAULT_DISPLAY_TIMEZONE;
}

export function useTimezoneSelector() {
  const context = useContext(TimezoneContext);
  if (!context) {
    throw new Error("useTimezoneSelector must be used within TimezoneProvider");
  }

  return {
    timezone: context.timezone,
    setTimezone: context.setTimezone,
    options: DISPLAY_TIMEZONE_OPTIONS,
  };
}
