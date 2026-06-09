"use server";

import { createClient } from "@/lib/supabase/server";
import { homeworkSchema, commentSchema, streakFreezeSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { getProfile, requireAdmin, canAccessStudent } from "@/lib/auth";

type ActionState = { error: string | null; success: boolean };

function parseJsonField(value: string | undefined, fallback: unknown[] = []) {
  if (!value?.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function createHomework(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const profile = await getProfile();

  const parsed = homeworkSchema.safeParse({
    student_id: formData.get("student_id"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    due_date: formData.get("due_date") || null,
    links: formData.get("links") || undefined,
    attachments: formData.get("attachments") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("homework_assignments").insert({
    student_id: parsed.data.student_id,
    title: parsed.data.title,
    description: parsed.data.description || null,
    due_date: parsed.data.due_date || null,
    links: parseJsonField(parsed.data.links),
    attachments: parseJsonField(parsed.data.attachments),
    created_by: profile?.id,
    status: "assigned",
  });

  if (error) return { error: error.message, success: false };

  revalidatePath("/admin");
  revalidatePath("/admin/homework");
  revalidatePath("/dashboard/homework");
  return { error: null, success: true };
}

export async function updateHomework(
  homeworkId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("homework_assignments")
    .update({
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      due_date: (formData.get("due_date") as string) || null,
      links: parseJsonField(formData.get("links") as string),
      attachments: parseJsonField(formData.get("attachments") as string),
      status: (formData.get("status") as string) || "assigned",
    })
    .eq("id", homeworkId);

  if (error) return { error: error.message, success: false };

  revalidatePath("/admin");
  return { error: null, success: true };
}

export async function deleteHomework(homeworkId: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("homework_assignments").delete().eq("id", homeworkId);
  revalidatePath("/admin");
}

export async function completeHomework(homeworkId: string) {
  const profile = await getProfile();
  if (!profile) return;

  const supabase = await createClient();
  const { data: hw } = await supabase
    .from("homework_assignments")
    .select("student_id")
    .eq("id", homeworkId)
    .single();

  if (!hw || !(await canAccessStudent(profile, hw.student_id))) return;

  await supabase
    .from("homework_assignments")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", homeworkId);

  revalidatePath("/dashboard/homework");
  revalidatePath("/parent");
}

export async function createTutorComment(
  studentId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const profile = await getProfile();

  const parsed = commentSchema.safeParse({
    student_id: studentId,
    study_log_id: formData.get("study_log_id") || null,
    comment: formData.get("comment"),
    visible_to_student: formData.get("visible_to_student") === "on",
    visible_to_parent: formData.get("visible_to_parent") === "on",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tutor_comments").insert({
    student_id: parsed.data.student_id,
    study_log_id: parsed.data.study_log_id || null,
    author_id: profile!.id,
    comment: parsed.data.comment,
    visible_to_student: parsed.data.visible_to_student,
    visible_to_parent: parsed.data.visible_to_parent,
  });

  if (error) return { error: error.message, success: false };

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/parent");
  return { error: null, success: true };
}

export async function applyStreakFreeze(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const profile = await getProfile();

  const parsed = streakFreezeSchema.safeParse({
    student_id: formData.get("student_id"),
    freeze_date: formData.get("freeze_date"),
    reason: formData.get("reason") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("streak_freezes").upsert(
    {
      student_id: parsed.data.student_id,
      freeze_date: parsed.data.freeze_date,
      reason: parsed.data.reason || null,
      created_by: profile?.id,
    },
    { onConflict: "student_id,freeze_date" }
  );

  if (error) return { error: error.message, success: false };

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}
