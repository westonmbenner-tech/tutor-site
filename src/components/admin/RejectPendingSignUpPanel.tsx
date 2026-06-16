"use client";

import { deletePendingSignUp } from "@/app/actions/admin";
import { ConfirmRemovalPanel } from "@/components/admin/ConfirmRemovalPanel";

export function RejectPendingSignUpPanel({
  profileId,
  userName,
  redirectTo = "/admin/students",
}: {
  profileId: string;
  userName: string;
  redirectTo?: string;
}) {
  return (
    <ConfirmRemovalPanel
      entityLabel="Sign-in"
      entityName={userName}
      consequences={[
        "Their Google login and TutorCheck account in Supabase",
        "Their profile and any role selection they made",
        "Access until they sign in again with Google if you invite them later",
      ]}
      redirectTo={redirectTo}
      onRemove={() => deletePendingSignUp(profileId)}
    />
  );
}
