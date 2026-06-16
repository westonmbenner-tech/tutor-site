"use client";

import { useState } from "react";
import { useActionState } from "react";
import { setRequestedRole } from "@/app/actions/profile";
import { RoleSelect } from "@/components/auth/RoleSelect";
import type { SignupRole } from "@/lib/types";

const initialState = { error: null as string | null, success: false };

export function RoleOnboardingForm() {
  const [role, setRole] = useState<SignupRole>("student");
  const [state, formAction, pending] = useActionState(
    setRequestedRole,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="form-group mb-0">
        <label className="label" htmlFor="onboarding-role">
          I am signing up as a
        </label>
        <RoleSelect
          id="onboarding-role"
          name="role"
          value={role}
          onChange={setRole}
        />
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          Your tutor will review and approve your account.
        </p>
      </div>
      {state.error && (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
