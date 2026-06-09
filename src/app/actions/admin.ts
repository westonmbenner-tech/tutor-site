"use server";

import { createClient } from "@/lib/supabase/server";
import { studentSchema, parentLinkSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

type ActionState = { error: string | null; success: boolean };

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
        .update({ role: "parent" })
        .eq("id", profileId);
    }
  }

  const { error } = await supabase.from("parents").insert({
    profile_id: profileId,
    display_name: parsed.data.display_name,
  });

  if (error) return { error: error.message, success: false };

  revalidatePath("/admin/parents");
  return { error: null, success: true };
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
  revalidatePath(`/admin/students/${parsed.data.student_id}`);
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
