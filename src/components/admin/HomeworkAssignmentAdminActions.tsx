"use client";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DeleteHomeworkPanel } from "@/components/admin/DeleteHomeworkPanel";
import { EditHomeworkForm } from "@/components/admin/EditHomeworkForm";
import type { HomeworkAssignment } from "@/lib/types";

type ResolvedHomework = HomeworkAssignment & {
  resolved_status: "assigned" | "completed" | "late" | "missing";
};

export function HomeworkAssignmentAdminActions({
  item,
}: {
  item: ResolvedHomework;
}) {
  return (
    <div className="space-y-3 border-t border-[var(--color-border)] pt-6">
      <CollapsibleSection title="Edit assignment">
        <EditHomeworkForm item={item} />
      </CollapsibleSection>

      <CollapsibleSection title="Delete assignment">
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          Permanently remove this homework assignment for the student.
        </p>
        <DeleteHomeworkPanel
          homeworkId={item.id}
          homeworkTitle={item.title}
          redirectTo="/admin/homework"
          startInConfirmStep
        />
      </CollapsibleSection>
    </div>
  );
}
