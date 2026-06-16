"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "@/app/actions/messages";

const initialState = { error: null as string | null, success: false };

export function MessageComposer({ studentId }: { studentId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const boundAction = sendMessage.bind(null, studentId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3 border-t border-[var(--color-border)] pt-4">
      <div className="form-group mb-0">
        <label className="label sr-only" htmlFor={`message-body-${studentId}`}>
          Message
        </label>
        <textarea
          id={`message-body-${studentId}`}
          name="body"
          rows={3}
          required
          maxLength={5000}
          placeholder="Write a message…"
        />
      </div>
      {state.error && (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary text-sm">
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
