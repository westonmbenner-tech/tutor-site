"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approvePendingProfile } from "@/app/actions/admin";
import { RoleSelect } from "@/components/auth/RoleSelect";
import { roleLabel } from "@/lib/profile-setup";
import type { Profile, SignupRole } from "@/lib/types";

export function PendingStudentApprovals({
  profiles,
}: {
  profiles: Profile[];
}) {
  if (profiles.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        No pending sign-ups. New users appear here after they sign in with Google.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--color-border)]">
      {profiles.map((profile) => (
        <PendingUserRow key={profile.id} profile={profile} />
      ))}
    </ul>
  );
}

function PendingUserRow({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [approveAs, setApproveAs] = useState<SignupRole>(
    profile.requested_role ?? "student"
  );
  const label = profile.full_name?.trim() || profile.email || "Unknown user";
  const requestedRole = profile.requested_role;

  function handleApprove() {
    startTransition(async () => {
      const result = await approvePendingProfile(profile.id, approveAs);
      if (result.error) return;
      if (result.studentId) {
        router.push(`/admin/students/${result.studentId}`);
      } else if (result.parentId) {
        router.push("/admin/parents");
      }
      router.refresh();
    });
  }

  return (
    <li className="flex flex-wrap items-end justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-800">{label}</p>
        {profile.email && profile.full_name && (
          <p className="text-xs text-[var(--color-muted)]">{profile.email}</p>
        )}
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Signed up {new Date(profile.created_at).toLocaleDateString()}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-600">Requested role</span>
          {requestedRole ? (
            <RoleSelect value={requestedRole} disabled />
          ) : (
            <span className="text-xs text-[var(--color-muted)]">Not selected yet</span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label
            htmlFor={`approve-as-${profile.id}`}
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            Approve as
          </label>
          <RoleSelect
            id={`approve-as-${profile.id}`}
            value={approveAs}
            onChange={setApproveAs}
            disabled={pending}
          />
        </div>
        <button
          type="button"
          onClick={handleApprove}
          disabled={pending}
          className="btn btn-primary shrink-0 text-sm"
        >
          {pending ? "Approving…" : `Approve ${roleLabel(approveAs).toLowerCase()}`}
        </button>
      </div>
    </li>
  );
}
