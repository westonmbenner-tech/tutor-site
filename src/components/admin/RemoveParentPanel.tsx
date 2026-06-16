"use client";

import { deleteParent } from "@/app/actions/admin";
import { ConfirmRemovalPanel } from "@/components/admin/ConfirmRemovalPanel";

export function RemoveParentPanel({
  parentId,
  parentName,
}: {
  parentId: string;
  parentName: string;
}) {
  return (
    <ConfirmRemovalPanel
      entityLabel="Parent"
      entityName={parentName}
      consequences={[
        "This parent profile and login link",
        "Links to student accounts (student data is kept)",
      ]}
      redirectTo="/admin/parents"
      onRemove={() => deleteParent(parentId)}
    />
  );
}
