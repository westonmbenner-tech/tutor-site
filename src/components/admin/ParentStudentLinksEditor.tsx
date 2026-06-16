"use client";

import { useActionState } from "react";
import { updateParentStudentLinks } from "@/app/actions/admin";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { StudentLinkPicker } from "@/components/admin/StudentLinkPicker";
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

  return (
    <CollapsibleSection title="Change linked students" className="w-full">
      <form action={formAction} className="space-y-4">
        <fieldset className="mb-0 border-0 p-0">
          <legend className="mb-3 block text-sm font-medium text-slate-800">
            Select students this parent can view
          </legend>
          <StudentLinkPicker
            students={students}
            linkedStudentIds={linkedStudentIds}
            emptyMessage="No students available to link."
          />
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            Saving replaces this parent&apos;s current student links.
          </p>
        </fieldset>

        {(state.error || state.success) && (
          <div className="space-y-2">
            {state.error && (
              <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
            )}
            {state.success && (
              <p className="text-sm text-[var(--color-primary)]">Links updated.</p>
            )}
          </div>
        )}

        <div className="flex justify-end border-t border-[var(--color-border)] pt-4">
          <button
            type="submit"
            disabled={pending || students.length === 0}
            className="btn btn-primary text-sm"
          >
            {pending ? "Saving…" : "Save linked students"}
          </button>
        </div>
      </form>
    </CollapsibleSection>
  );
}
