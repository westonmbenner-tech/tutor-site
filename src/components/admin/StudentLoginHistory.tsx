import { DisplayDateTime } from "@/components/timezone/DisplayDateTime";
import { getRecentLogins } from "@/lib/login-history";

export function StudentLoginHistory({
  loginHistory,
}: {
  loginHistory: unknown;
}) {
  const logins = getRecentLogins(loginHistory, 5);

  if (logins.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">No sign-ins recorded yet.</p>
    );
  }

  return (
    <ul className="space-y-2 text-sm text-slate-700">
      {logins.map((loginAt) => (
        <li key={loginAt}>
          <DisplayDateTime iso={loginAt} variant="datetime" />
        </li>
      ))}
    </ul>
  );
}
