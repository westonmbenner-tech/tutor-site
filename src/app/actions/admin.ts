"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { studentSchema, parentLinkSchema, createParentSchema, updateParentLinksSchema } from "@/lib/validations";
import type { SignupRole } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

type ActionState = {
  error: string | null;
  success: boolean;
  studentId?: string;
  parentId?: string;
};

export async function approvePendingProfile(
  profileId: string,
  asRole: SignupRole
): Promise<ActionState> {
  await requireAdmin();

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .neq("role", "admin")
    .maybeSingle();

  if (!profile) {
    return { error: "User profile not found.", success: false };
  }

  const displayName =
    profile.full_name?.trim() ||
    profile.email?.split("@")[0] ||
    (asRole === "parent" ? "Parent" : "Student");

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: asRole, requested_role: asRole })
    .eq("id", profileId);

  if (profileError) {
    return { error: profileError.message, success: false };
  }

  if (asRole === "student") {
    const { data: existing } = await supabase
      .from("students")
      .select("id")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (existing) {
      return { error: null, success: true, studentId: existing.id };
    }

    const { data: student, error } = await supabase
      .from("students")
      .insert({
        profile_id: profileId,
        display_name: displayName,
        active: true,
        streak_freeze_balance: 10,
      })
      .select("id")
      .single();

    if (error) return { error: error.message, success: false };

    revalidatePath("/admin");
    revalidatePath("/admin/students");
    revalidatePath("/admin/parents");
    return { error: null, success: true, studentId: student.id };
  }

  const { data: existingParent } = await supabase
    .from("parents")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (existingParent) {
    return { error: null, success: true, parentId: existingParent.id };
  }

  const { data: parent, error } = await supabase
    .from("parents")
    .insert({
      profile_id: profileId,
      display_name: displayName,
    })
    .select("id")
    .single();

  if (error) return { error: error.message, success: false };

  revalidatePath("/admin");
  revalidatePath("/admin/students");
  revalidatePath("/admin/parents");
  return { error: null, success: true, parentId: parent.id };
}

/** @deprecated Use approvePendingProfile */
export async function approveStudentProfile(
  profileId: string
): Promise<ActionState> {
  return approvePendingProfile(profileId, "student");
}

export async function deletePendingSignUp(
  profileId: string
): Promise<ActionState> {
  await requireAdmin();

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", profileId)
    .maybeSingle();

  if (!profile) {
    return { error: "User profile not found.", success: false };
  }

  if (profile.role === "admin") {
    return { error: "Cannot delete an admin account.", success: false };
  }

  const [{ data: student }, { data: parent }] = await Promise.all([
    supabase.from("students").select("id").eq("profile_id", profileId).maybeSingle(),
    supabase.from("parents").select("id").eq("profile_id", profileId).maybeSingle(),
  ]);

  if (student || parent) {
    return {
      error:
        "This user already has an approved student or parent profile. Remove that record first.",
      success: false,
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(profileId);

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/students");
  return { error: null, success: true };
}

export async function createStudent(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = studentSchema.safeParse({
    profile_email: formData.get("profile_email") || undefined,
    display_name: formData.get("display_name"),
    profile_id: formData.get("profile_id") || null,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const supabase = await createClient();
  let profileId = parsed.data.profile_id || null;

  if (parsed.data.profile_email) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", parsed.data.profile_email)
      .maybeSingle();

    if (profile) {
      profileId = profile.id;
      await supabase
        .from("profiles")
        .update({ role: "student" })
        .eq("id", profileId);
    }
  }

  const { error } = await supabase.from("students").insert({
    profile_id: profileId,
    display_name: parsed.data.display_name,
    active: true,
    streak_freeze_balance: 10,
  });

  if (error) return { error: error.message, success: false };

  revalidatePath("/admin/students");
  return { error: null, success: true };
}

export async function createParent(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = createParentSchema.safeParse({
    profile_email: formData.get("profile_email") || undefined,
    display_name: formData.get("display_name"),
    profile_id: formData.get("profile_id") || null,
    student_ids: formData.getAll("student_ids"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const supabase = await createClient();
  let profileId = parsed.data.profile_id || null;

  if (parsed.data.profile_email) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", parsed.data.profile_email)
      .maybeSingle();

    if (profile) {
      profileId = profile.id;
      await supabase
        .from("profiles")
        .update({ role: "parent" })
        .eq("id", profileId);
    }
  }

  const { data: parent, error } = await supabase
    .from("parents")
    .insert({
      profile_id: profileId,
      display_name: parsed.data.display_name,
    })
    .select("id")
    .single();

  if (error) return { error: error.message, success: false };

  const { error: linkError } = await supabase.from("parent_student_links").upsert(
    parsed.data.student_ids.map((studentId) => ({
      parent_id: parent.id,
      student_id: studentId,
    })),
    { onConflict: "parent_id,student_id" }
  );

  if (linkError) return { error: linkError.message, success: false };

  revalidatePath("/admin/parents");
  revalidatePath("/admin/students");
  parsed.data.student_ids.forEach((studentId) => {
    revalidatePath(`/admin/students/${studentId}`);
  });
  return { error: null, success: true, parentId: parent.id };
}

export async function linkParentToStudent(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = parentLinkSchema.safeParse({
    parent_id: formData.get("parent_id"),
    student_id: formData.get("student_id"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("parent_student_links").upsert(
    {
      parent_id: parsed.data.parent_id,
      student_id: parsed.data.student_id,
    },
    { onConflict: "parent_id,student_id" }
  );

  if (error) return { error: error.message, success: false };

  revalidatePath("/admin");
  revalidatePath("/admin/parents");
  revalidatePath(`/admin/students/${parsed.data.student_id}`);
  return { error: null, success: true };
}

export async function updateParentStudentLinks(
  parentId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = updateParentLinksSchema.safeParse({
    parent_id: parentId,
    student_ids: formData.getAll("student_ids"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const supabase = await createClient();

  const { data: parent } = await supabase
    .from("parents")
    .select("id")
    .eq("id", parentId)
    .maybeSingle();

  if (!parent) {
    return { error: "Parent not found.", success: false };
  }

  const { data: existingLinks } = await supabase
    .from("parent_student_links")
    .select("student_id")
    .eq("parent_id", parentId);

  const affectedStudentIds = new Set([
    ...(existingLinks ?? []).map((link) => link.student_id),
    ...parsed.data.student_ids,
  ]);

  const { error: deleteError } = await supabase
    .from("parent_student_links")
    .delete()
    .eq("parent_id", parentId);

  if (deleteError) {
    return { error: deleteError.message, success: false };
  }

  const { error: insertError } = await supabase.from("parent_student_links").insert(
    parsed.data.student_ids.map((studentId) => ({
      parent_id: parentId,
      student_id: studentId,
    }))
  );

  if (insertError) {
    return { error: insertError.message, success: false };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/parents");
  revalidatePath("/parent");
  affectedStudentIds.forEach((studentId) => {
    revalidatePath(`/admin/students/${studentId}`);
  });
  return { error: null, success: true, parentId };
}

export async function deleteStudent(studentId: string): Promise<ActionState> {
  await requireAdmin();

  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("id", studentId)
    .maybeSingle();

  if (!student) {
    return { error: "Student not found.", success: false };
  }

  const { error } = await supabase.from("students").delete().eq("id", studentId);

  if (error) return { error: error.message, success: false };

  revalidatePath("/admin");
  revalidatePath("/admin/students");
  revalidatePath("/admin/homework");
  revalidatePath("/admin/messages");
  revalidatePath("/admin/parents");
  revalidatePath("/dashboard");
  revalidatePath("/parent");
  return { error: null, success: true };
}

export async function deleteParent(parentId: string): Promise<ActionState> {
  await requireAdmin();

  const supabase = await createClient();
  const { data: parent } = await supabase
    .from("parents")
    .select("id")
    .eq("id", parentId)
    .maybeSingle();

  if (!parent) {
    return { error: "Parent not found.", success: false };
  }

  const { error } = await supabase.from("parents").delete().eq("id", parentId);

  if (error) return { error: error.message, success: false };

  revalidatePath("/admin");
  revalidatePath("/admin/parents");
  revalidatePath("/admin/students");
  revalidatePath("/parent");
  return { error: null, success: true };
}

export async function generateParentSummaryAction(
  studentId: string,
  startDate: string,
  endDate: string
): Promise<{ markdown: string; error?: string }> {
  await requireAdmin();

  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("display_name")
    .eq("id", studentId)
    .single();

  if (!student) return { markdown: "", error: "Student not found" };

  const [{ data: logs }, { data: homework }, { data: mistakes }, { data: comments }] =
    await Promise.all([
      supabase
        .from("study_logs")
        .select("*")
        .eq("student_id", studentId)
        .gte("log_date", startDate)
        .lte("log_date", endDate),
      supabase
        .from("homework_assignments")
        .select("*")
        .eq("student_id", studentId),
      supabase
        .from("mistakes")
        .select("*, mistake_labels(name)")
        .eq("student_id", studentId)
        .gte("mistake_date", startDate)
        .lte("mistake_date", endDate),
      supabase
        .from("tutor_comments")
        .select("comment, created_at, profiles(full_name)")
        .eq("student_id", studentId)
        .eq("visible_to_parent", true)
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`),
    ]);

  const { resolveHomeworkStatuses, computeWeeklyProgress, computeWeeklyStreak } =
    await import("@/lib/streak");
  const { generateParentSummaryMarkdown } = await import("@/lib/analytics");

  const { data: allLogs } = await supabase
    .from("study_logs")
    .select("log_date")
    .eq("student_id", studentId);

  const { data: freezes } = await supabase
    .from("streak_freezes")
    .select("freeze_date")
    .eq("student_id", studentId);

  const progress = computeWeeklyProgress(allLogs ?? [], freezes ?? []);
  const streak = computeWeeklyStreak(allLogs ?? [], freezes ?? []);
  const resolvedHw = resolveHomeworkStatuses(homework ?? []);

  const markdown = generateParentSummaryMarkdown({
    studentName: student.display_name,
    startDate,
    endDate,
    logs: logs ?? [],
    homework: resolvedHw,
    mistakes: mistakes ?? [],
    comments: (comments ?? []).map((c) => ({
      comment: c.comment,
      created_at: c.created_at,
      author: (c.profiles as { full_name?: string } | null)?.full_name,
    })),
    weeklyProgressText: `${progress.effectiveDays} of ${progress.targetDays} study days this week`,
    streakCount: streak,
  });

  return { markdown };
}
