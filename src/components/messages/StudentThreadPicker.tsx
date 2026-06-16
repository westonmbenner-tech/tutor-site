import Link from "next/link";
import type { Student } from "@/lib/types";

export function StudentThreadPicker({
  students,
  activeStudentId,
  basePath,
}: {
  students: Pick<Student, "id" | "display_name">[];
  activeStudentId: string;
  basePath: string;
}) {
  if (students.length <= 1) return null;

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {students.map((student) => {
        const isActive = student.id === activeStudentId;
        return (
          <Link
            key={student.id}
            href={`${basePath}?student=${student.id}`}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              isActive
                ? "bg-[var(--color-primary)] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-[var(--color-primary-light)]"
            }`}
          >
            {student.display_name}
          </Link>
        );
      })}
    </div>
  );
}
