import { AppShell } from "@/components/layout/AppShell";
import { DashboardCard } from "@/components/DashboardCard";
import { CreateParentForm } from "@/components/admin/CreateParentForm";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminParentsPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const { data: parents } = await supabase
    .from("parents")
    .select("*, parent_student_links(student_id, students(display_name))")
    .order("display_name");

  return (
    <AppShell role="admin" userName={profile.full_name ?? "Tutor"}>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">Parents</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Add parent">
          <CreateParentForm />
        </DashboardCard>
        <DashboardCard title="Registered parents">
          {!parents?.length ? (
            <div className="empty-state">No parents yet.</div>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {parents.map((p) => (
                <li key={p.id} className="py-3">
                  <p className="font-medium text-slate-800">{p.display_name}</p>
                  <ul className="mt-1 text-xs text-[var(--color-muted)]">
                    {(p.parent_student_links as { students: { display_name: string } }[] | null)?.map(
                      (link, i) => (
                        <li key={i}>Linked to {link.students.display_name}</li>
                      )
                    ) ?? <li>No linked students</li>}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </div>
    </AppShell>
  );
}
