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
    <li className="py-5 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-800">{parent.display_name}</p>
          <div className="mt-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
              Linked students
            </p>
            {links.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {links.map((link) => (
                  <li
                    key={link.student_id}
                    className="rounded-full bg-[var(--color-primary-light)]/60 px-3 py-1 text-xs font-medium text-[var(--color-primary)]"
                  >
                    {link.students.display_name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                No students linked yet
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0 lg:pt-1">
          <RemoveParentPanel parentId={parent.id} parentName={parent.display_name} />
        </div>
      </div>

      <div className="mt-4 w-full">
        <ParentStudentLinksEditor
          parentId={parent.id}
          students={students}
          linkedStudentIds={linkedStudentIds}
        />
      </div>
    </li>
  );
}
