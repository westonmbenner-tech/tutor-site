"use client";

import { deleteHomework } from "@/app/actions/homework";
import { ConfirmRemovalPanel } from "@/components/admin/ConfirmRemovalPanel";

export function DeleteHomeworkPanel({
  homeworkId,
  homeworkTitle,
  redirectTo = "/admin/homework",
}: {
  homeworkId: string;
  homeworkTitle: string;
  redirectTo?: string;
}) {
  return (
    <ConfirmRemovalPanel
      entityLabel="Assignment"
      entityName={homeworkTitle}
      consequences={[
        "This homework assignment and its due date",
        "The student's submission for this assignment",
        "Tutor comments linked to this assignment",
      ]}
      redirectTo={redirectTo}
      onRemove={() => deleteHomework(homeworkId)}
    />
  );
}
