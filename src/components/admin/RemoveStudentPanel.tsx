"use client";

import { deleteStudent } from "@/app/actions/admin";
import { ConfirmRemovalPanel } from "@/components/admin/ConfirmRemovalPanel";

export function RemoveStudentPanel({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  return (
    <ConfirmRemovalPanel
      entityLabel="Student"
      entityName={studentName}
      consequences={[
        "Study logs, streaks, and streak freeze history",
        "Homework assignments and submissions",
        "Mistakes, labels, and AI summaries",
        "Messages and tutor comments for this student",
        "Parent links to this student",
      ]}
      redirectTo="/admin/students"
      onRemove={() => deleteStudent(studentId)}
    />
  );
}
