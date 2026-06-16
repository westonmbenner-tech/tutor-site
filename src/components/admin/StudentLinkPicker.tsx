import type { Student } from "@/lib/types";

export function StudentLinkPicker({
  students,
  linkedStudentIds,
  name = "student_ids",
  emptyMessage = "No students available.",
}: {
  students: Pick<Student, "id" | "display_name">[];
  linkedStudentIds?: string[];
  name?: string;
  emptyMessage?: string;
}) {
  if (students.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">{emptyMessage}</p>
    );
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {students.map((student) => {
        const isLinked = linkedStudentIds?.includes(student.id) ?? false;

        return (
          <li key={student.id}>
            <label
              className={`flex h-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                isLinked
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]/40 text-slate-800"
                  : "border-[var(--color-border)] bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <input
                type="checkbox"
                name={name}
                value={student.id}
                defaultChecked={isLinked}
                className="h-4 w-4 shrink-0 accent-[var(--color-primary)]"
              />
              <span className="min-w-0 font-medium leading-snug">
                {student.display_name}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
