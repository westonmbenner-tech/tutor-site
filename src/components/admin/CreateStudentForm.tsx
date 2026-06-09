"use client";

import { useActionState } from "react";
import { createStudent } from "@/app/actions/admin";

const initialState = { error: null as string | null, success: false };

export function CreateStudentForm() {
  const [state, formAction, pending] = useActionState(createStudent, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="form-group">
        <label className="label" htmlFor="display_name">
          Display name
        </label>
        <input id="display_name" name="display_name" required />
      </div>
      <div className="form-group">
        <label className="label" htmlFor="profile_email">
          Link to profile email (optional)
        </label>
        <input
          id="profile_email"
          name="profile_email"
          type="email"
          placeholder="student@gmail.com"
        />
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Student must sign in with Google first, then enter their email here.
        </p>
      </div>
      {state.error && (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-[var(--color-primary)]">Student created.</p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary">
        Add student
      </button>
    </form>
  );
}
