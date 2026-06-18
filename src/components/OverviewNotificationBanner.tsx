import type { NotificationSummary } from "@/lib/notifications";
import { hasNotifications } from "@/lib/notifications";
import Link from "next/link";

export function OverviewNotificationBanner({
  notifications,
  overviewHref,
  messagesHref,
}: {
  notifications: NotificationSummary;
  overviewHref: string;
  messagesHref: string;
}) {
  if (!hasNotifications(notifications)) {
    return null;
  }

  const parts: string[] = [];

  if (notifications.newMessages > 0) {
    parts.push(
      `${notifications.newMessages} new message${notifications.newMessages === 1 ? "" : "s"}`
    );
  }

  if (notifications.newComments > 0) {
    parts.push(
      `${notifications.newComments} new comment${notifications.newComments === 1 ? "" : "s"}`
    );
  }

  return (
    <div
      role="status"
      className="mb-6 rounded-xl border border-[var(--color-primary-light)] bg-[var(--color-primary-light)]/60 px-4 py-3 text-sm text-slate-800"
    >
      <p className="font-medium">Since your last visit</p>
      <p className="mt-1">
        You have {parts.join(" and ")}.{" "}
        {notifications.newMessages > 0 && (
          <Link href={messagesHref} className="text-[var(--color-primary)] hover:underline">
            View messages
          </Link>
        )}
        {notifications.newMessages > 0 && notifications.newComments > 0 ? " · " : null}
        {notifications.newComments > 0 && (
          <Link href={overviewHref} className="text-[var(--color-primary)] hover:underline">
            View comments
          </Link>
        )}
      </p>
    </div>
  );
}
