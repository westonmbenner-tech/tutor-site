import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardCard } from "@/components/DashboardCard";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CreateStudentForm } from "@/components/admin/CreateStudentForm";
import { PendingStudentApprovals } from "@/components/admin/PendingStudentApprovals";
import { requireAdmin } from "@/lib/auth";
import {
  fetchApprovedStudents,
  fetchPendingProfiles,
} from "@/lib/data";

export default async function AdminStudentsPage() {
  const profile = await requireAdmin();
  const [pendingProfiles, approvedStudents] = await Promise.all([
    fetchPendingProfiles(),
    fetchApprovedStudents(),
  ]);

  return (
    <AppShell role="admin" userName={profile.full_name ?? "Tutor"}>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">Students</h1>

      <DashboardCard
        title="Pending approval"
        subtitle="Users who signed in but do not have an approved student or parent profile yet."
        className="mb-6"
      >
        <PendingStudentApprovals profiles={pendingProfiles} />
      </DashboardCard>

      <div className="mb-6">
        <CollapsibleSection title="Add student manually">
          <CreateStudentForm />
        </CollapsibleSection>
      </div>

      <DashboardCard title="Approved students">
        {approvedStudents.length === 0 ? (
          <div className="empty-state">No approved students yet.</div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {approvedStudents.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <Link
                    href={`/admin/students/${s.id}`}
                    className="font-medium text-slate-800 hover:text-[var(--color-primary)]"
                  >
                    {s.display_name}
                  </Link>
                  <p className="text-xs text-[var(--color-muted)]">
                    {s.profile?.email ?? "No linked login"}
                    {s.active ? " · Active" : " · Inactive"}
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
    </AppShell>
  );
}
