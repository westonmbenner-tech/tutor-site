"use client";

import { useActionState } from "react";
import { createParent } from "@/app/actions/admin";
import type { Student } from "@/lib/types";

const initialState = { error: null as string | null, success: false };

export function CreateParentForm({
  students,
}: {
  students: Pick<Student, "id" | "display_name">[];
}) {
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
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Parent must sign in with Google first, then enter their email here.
        </p>
      </div>

      <fieldset className="form-group mb-0">
        <legend className="label mb-2">Link to students</legend>
        {students.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            No students yet. Add a student before registering a parent.
          </p>
        ) : (
          <ul className="space-y-2 rounded-lg border border-[var(--color-border)] p-3">
            {students.map((student) => (
              <li key={student.id}>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="student_ids"
                    value={student.id}
                  />
                  {student.display_name}
                </label>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          Select which student&apos;s progress this parent can view.
        </p>
      </fieldset>

      {state.error && (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-[var(--color-primary)]">
          Parent created and linked to selected student(s).
        </p>
      )}
      <button
        type="submit"
        disabled={pending || students.length === 0}
        className="btn btn-primary"
      >
        Add parent
      </button>
    </form>
  );
}
