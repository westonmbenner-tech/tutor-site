import { redirect } from "next/navigation";
import { RoleOnboardingForm } from "@/components/auth/RoleOnboardingForm";
import { getProfile, requireAuth } from "@/lib/auth";
import { needsRoleSelection } from "@/lib/profile-setup";
import { roleHomePath } from "@/lib/roles";

export default async function OnboardingPage() {
  await requireAuth();
  const profile = await getProfile();

  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect(roleHomePath("admin"));
  if (!needsRoleSelection(profile)) redirect(roleHomePath(profile.role));

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-800">
            Welcome to TutorCheck
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Tell us how you&apos;ll use this account. Your tutor will approve it
            shortly.
          </p>
        </div>
        <RoleOnboardingForm />
      </div>
    </div>
  );
}
