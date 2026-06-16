"use client";

import { useActionState } from "react";
import { updateParentStudentLinks } from "@/app/actions/admin";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import type { Student } from "@/lib/types";

const initialState = { error: null as string | null, success: false };

export function ParentStudentLinksEditor({
  parentId,
  students,
  linkedStudentIds,
}: {
  parentId: string;
  students: Pick<Student, "id" | "display_name">[];
  linkedStudentIds: string[];
}) {
  const boundAction = updateParentStudentLinks.bind(null, parentId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  if (students.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        No students available to link.
      </p>
    );
  }

  return (
    <CollapsibleSection title="Change linked students">
      <form action={formAction} className="space-y-4">
        <fieldset className="form-group mb-0">
          <legend className="sr-only">Linked students</legend>
          <ul className="space-y-2 rounded-lg border border-[var(--color-border)] p-3">
            {students.map((student) => (
              <li key={student.id}>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="student_ids"
                    value={student.id}
                    defaultChecked={linkedStudentIds.includes(student.id)}
                  />
                  {student.display_name}
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            Choose which students this parent can view. Saving replaces their
            current links.
          </p>
        </fieldset>
        {state.error && (
          <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
        )}
        {state.success && (
          <p className="text-sm text-[var(--color-primary)]">Links updated.</p>
        )}
        <button type="submit" disabled={pending} className="btn btn-primary text-sm">
          {pending ? "Saving…" : "Save linked students"}
        </button>
      </form>
    </CollapsibleSection>
  );
}
