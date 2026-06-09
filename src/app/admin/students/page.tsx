import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardCard } from "@/components/DashboardCard";
import { CreateStudentForm } from "@/components/admin/CreateStudentForm";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminStudentsPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("students")
    .select("*")
    .order("display_name");

  return (
    <AppShell role="admin" userName={profile.full_name ?? "Tutor"}>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">Students</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Add student">
          <CreateStudentForm />
        </DashboardCard>
        <DashboardCard title="Registered students">
          {!students?.length ? (
            <div className="empty-state">No students yet.</div>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {students.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-3">
                  <div>
                    <Link
                      href={`/admin/students/${s.id}`}
                      className="font-medium text-slate-800 hover:text-[var(--color-primary)]"
                    >
                      {s.display_name}
                    </Link>
                    <p className="text-xs text-[var(--color-muted)]">
                      {s.active ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <Link
                    href={`/admin/students/${s.id}`}
                    className="text-sm text-[var(--color-accent)]"
                  >
                    View →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </div>
    </AppShell>
  );
}
