import { MessageComposer } from "@/components/messages/MessageComposer";
import { authorRoleLabel, formatMessageTime } from "@/lib/messages";
import type { Message } from "@/lib/types";
import type { UserRole } from "@/lib/types";

export function MessageThread({
  studentId,
  studentName,
  messages,
  currentUserId,
}: {
  studentId: string;
  studentName: string;
  messages: Message[];
  currentUserId: string;
}) {
  return (
    <div className="flex flex-col">
      <p className="mb-4 text-sm text-[var(--color-muted)]">
        Conversation about <span className="font-medium text-slate-800">{studentName}</span>.
        Tutor, student, and linked parents can all see messages here.
      </p>

      <div className="mb-4 max-h-[28rem] space-y-3 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-slate-50/50 p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            No messages yet. Start the conversation below.
          </p>
        ) : (
          messages.map((message) => {
            const isSelf = message.author_id === currentUserId;
            const authorName =
              message.profiles?.full_name?.trim() ||
              authorRoleLabel(message.profiles?.role as UserRole | undefined);
            const roleLabel = authorRoleLabel(
              message.profiles?.role as UserRole | undefined
            );

            return (
              <article
                key={message.id}
                className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                    isSelf
                      ? "bg-[var(--color-primary)] text-white"
                      : "border border-[var(--color-border)] bg-white text-slate-800"
                  }`}
                >
                  <p
                    className={`mb-1 text-xs font-medium ${
                      isSelf ? "text-white/80" : "text-[var(--color-muted)]"
                    }`}
                  >
                    {isSelf ? "You" : authorName} · {roleLabel}
                  </p>
                  <p className="whitespace-pre-wrap">{message.body}</p>
                  <p
                    className={`mt-2 text-xs ${
                      isSelf ? "text-white/70" : "text-[var(--color-muted)]"
                    }`}
                  >
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </article>
            );
          })
        )}
      </div>

      <MessageComposer studentId={studentId} />
    </div>
  );
}
