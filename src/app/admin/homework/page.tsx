import { AppShell } from "@/components/layout/AppShell";
import { DashboardCard } from "@/components/DashboardCard";
import { CreateHomeworkForm } from "@/components/admin/CreateHomeworkForm";
import { AdminHomeworkList } from "@/components/admin/AdminHomeworkSubmissions";
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
      <h1
        id="homework"
        className="mb-6 scroll-mt-24 text-2xl font-semibold text-slate-800"
      >
        Homework
      </h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Assign homework">
          <CreateHomeworkForm students={(students ?? []) as Student[]} />
        </DashboardCard>
        <DashboardCard
          title="All assignments"
          subtitle="Click a title to review the submission and leave feedback."
        >
          <AdminHomeworkList items={resolved} />
        </DashboardCard>
      </div>
    </AppShell>
  );
}
