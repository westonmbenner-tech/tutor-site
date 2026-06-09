"use client";

import { useActionState } from "react";
import { createParent } from "@/app/actions/admin";

const initialState = { error: null as string | null, success: false };

export function CreateParentForm() {
  const [state, formAction, pending] = useActionState(createParent, initialState);

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
        <input id="profile_email" name="profile_email" type="email" />
      </div>
      {state.error && (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-[var(--color-primary)]">Parent created.</p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary">
        Add parent
      </button>
    </form>
  );
}
