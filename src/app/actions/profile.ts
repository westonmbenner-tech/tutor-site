"use server";

import { createClient } from "@/lib/supabase/server";
import { getProfile, requireAuth } from "@/lib/auth";
import { roleHomePath } from "@/lib/roles";
import type { SignupRole } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type ActionState = { error: string | null; success: boolean };

export async function setRequestedRole(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAuth();
  const profile = await getProfile();

  if (!profile) {
    return { error: "Profile not found.", success: false };
  }

  if (profile.role === "admin") {
    redirect(roleHomePath("admin"));
  }

  if (profile.requested_role) {
    redirect(roleHomePath(profile.role));
  }

  const role = formData.get("role");
  if (role !== "student" && role !== "parent") {
    return { error: "Please choose student or parent.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      role: role as SignupRole,
      requested_role: role as SignupRole,
    })
    .eq("id", profile.id);

  if (error) return { error: error.message, success: false };

  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
  revalidatePath("/parent");
  revalidatePath("/admin");

  redirect(roleHomePath(role as SignupRole));
}
