import { AppShell } from "@/components/layout/AppShell";
import { DashboardCard } from "@/components/DashboardCard";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CreateParentForm } from "@/components/admin/CreateParentForm";
import { ParentListItem } from "@/components/admin/ParentListItem";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminParentsPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const [{ data: parents }, { data: students }] = await Promise.all([
    supabase
      .from("parents")
      .select("id, display_name, parent_student_links(student_id, students(display_name))")
      .order("display_name"),
    supabase
      .from("students")
      .select("id, display_name")
      .eq("active", true)
      .order("display_name"),
  ]);

  const parentRows = (parents ?? []).map((parent) => {
    const links = (parent.parent_student_links ?? []).map((link) => {
      const student = Array.isArray(link.students)
        ? link.students[0]
        : link.students;

      return {
        student_id: link.student_id as string,
        students: {
          display_name: (student?.display_name as string | undefined) ?? "Student",
        },
      };
    });

    return {
      id: parent.id as string,
      display_name: parent.display_name as string,
      parent_student_links: links,
    };
  });

  return (
    <AppShell role="admin" userName={profile.full_name ?? "Tutor"}>
      <h1
        id="parents"
        className="mb-6 scroll-mt-24 text-2xl font-semibold text-slate-800"
      >
        Parents
      </h1>

      <div className="mb-6">
        <CollapsibleSection title="Add parent manually">
          <CreateParentForm students={students ?? []} />
        </CollapsibleSection>
      </div>

      <DashboardCard title="Registered parents">
        {parentRows.length === 0 ? (
          <div className="empty-state">No parents yet.</div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {parentRows.map((parent) => (
              <ParentListItem
                key={parent.id}
                parent={parent}
                students={students ?? []}
              />
            ))}
          </ul>
        )}
      </DashboardCard>
    </AppShell>
  );
}
