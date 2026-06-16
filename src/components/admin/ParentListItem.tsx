import { ParentStudentLinksEditor } from "@/components/admin/ParentStudentLinksEditor";
import { RemoveParentPanel } from "@/components/admin/RemoveParentPanel";
import type { Student } from "@/lib/types";

type ParentLink = {
  student_id: string;
  students: { display_name: string };
};

export function ParentListItem({
  parent,
  students,
}: {
  parent: {
    id: string;
    display_name: string;
    parent_student_links: ParentLink[] | null;
  };
  students: Pick<Student, "id" | "display_name">[];
}) {
  const links = parent.parent_student_links ?? [];
  const linkedStudentIds = links.map((link) => link.student_id);

  return (
    <li className="space-y-3 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-slate-800">{parent.display_name}</p>
          <ul className="mt-1 text-xs text-[var(--color-muted)]">
            {links.length > 0 ? (
              links.map((link) => (
                <li key={link.student_id}>
                  Linked to {link.students.display_name}
                </li>
              ))
            ) : (
              <li>No linked students</li>
            )}
          </ul>
        </div>
        <RemoveParentPanel parentId={parent.id} parentName={parent.display_name} />
      </div>
      <ParentStudentLinksEditor
        parentId={parent.id}
        students={students}
        linkedStudentIds={linkedStudentIds}
      />
    </li>
  );
}
