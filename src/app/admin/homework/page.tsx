import { AppShell } from "@/components/layout/AppShell";
import { DashboardCard } from "@/components/DashboardCard";
import { HomeworkList } from "@/components/HomeworkList";
import { CreateHomeworkForm } from "@/components/admin/CreateHomeworkForm";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolveHomeworkStatuses } from "@/lib/streak";
import type { HomeworkAssignment, Student } from "@/lib/types";

export default async function AdminHomeworkPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const [{ data: students }, { data: homework }] = await Promise.all([
    supabase.from("students").select("*").eq("active", true).order("display_name"),
    supabase
      .from("homework_assignments")
      .select("*, students(display_name)")
      .order("created_at", { ascending: false }),
  ]);

  const resolved = resolveHomeworkStatuses(
    (homework ?? []) as HomeworkAssignment[]
  );

  return (
    <AppShell role="admin" userName={profile.full_name ?? "Tutor"}>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">Homework</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Assign homework">
          <CreateHomeworkForm students={(students ?? []) as Student[]} />
        </DashboardCard>
        <DashboardCard title="All assignments">
          {resolved.length === 0 ? (
            <div className="empty-state">No homework assigned yet.</div>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {resolved.map((h) => (
                <li key={h.id} className="py-3">
                  <p className="font-medium text-slate-800">{h.title}</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {(h as HomeworkAssignment & { students?: { display_name: string } })
                      .students?.display_name ?? "Student"}{" "}
                    · {h.resolved_status}
                    {h.due_date ? ` · due ${h.due_date}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </div>
    </AppShell>
  );
}
