export const SESSION_LOGIN_COOKIE = "tc_session_login";
export const NOTIFICATION_BASELINE_COOKIE = "tc_notif_baseline";

const MAX_LOGIN_HISTORY = 50;

export function parseLoginHistory(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((entry): entry is string => typeof entry === "string")
    .slice(0, MAX_LOGIN_HISTORY);
}

export function getRecentLogins(raw: unknown, limit = 5): string[] {
  return parseLoginHistory(raw).slice(0, limit);
}
