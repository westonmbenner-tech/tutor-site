import Link from "next/link";
import { RoleAppShell } from "@/components/layout/RoleAppShell";
import { DashboardCard } from "@/components/DashboardCard";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminMessagesIndexPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("students")
    .select("id, display_name, active")
    .eq("active", true)
    .order("display_name");

  return (
    <RoleAppShell profile={profile} userName={profile.full_name ?? "Tutor"}>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">Messages</h1>
      <DashboardCard title="Student conversations">
        {!students?.length ? (
          <p className="text-sm text-[var(--color-muted)]">No active students.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {students.map((student) => (
              <li key={student.id}>
                <Link
                  href={`/admin/messages/${student.id}`}
                  className="flex items-center justify-between py-3 text-sm hover:text-[var(--color-primary)]"
                >
                  <span className="font-medium text-slate-800">
                    {student.display_name}
                  </span>
                  <span className="text-[var(--color-muted)]">Open chat →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>
    </RoleAppShell>
  );
}
