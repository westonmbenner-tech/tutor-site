"use server";

import { createClient } from "@/lib/supabase/server";
import { homeworkSchema, commentSchema, streakFreezeSchema, homeworkSubmissionSchema } from "@/lib/validations";
import { applyStreakFreezeWithBalance } from "@/lib/streak-freezes";
import { revalidatePath } from "next/cache";
import { getProfile, requireAdmin, canAccessStudent, getStudentForProfile, requireStudent } from "@/lib/auth";

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

export async function completeHomework(
  homeworkId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await getProfile();
  if (!profile) {
    return { error: "Unauthorized", success: false };
  }

  const parsed = homeworkSubmissionSchema.safeParse({
    submission_text: formData.get("submission_text"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const supabase = await createClient();
  const { data: hw } = await supabase
    .from("homework_assignments")
    .select("student_id")
    .eq("id", homeworkId)
    .single();

  if (!hw || !(await canAccessStudent(profile, hw.student_id))) {
    return { error: "Unauthorized", success: false };
  }

  const { error } = await supabase
    .from("homework_assignments")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      submission_text: parsed.data.submission_text.trim(),
    })
    .eq("id", homeworkId);

  if (error) return { error: error.message, success: false };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/homework");
  revalidatePath("/admin");
  revalidatePath("/admin/homework");
  revalidatePath("/parent");
  return { error: null, success: true };
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
    homework_assignment_id: formData.get("homework_assignment_id") || null,
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
    homework_assignment_id: parsed.data.homework_assignment_id || null,
    author_id: profile!.id,
    comment: parsed.data.comment,
    visible_to_student: parsed.data.visible_to_student,
    visible_to_parent: parsed.data.visible_to_parent,
  });

  if (error) return { error: error.message, success: false };

  revalidatePath("/admin");
  revalidatePath("/admin/homework");
  if (parsed.data.homework_assignment_id) {
    revalidatePath(`/admin/homework/${parsed.data.homework_assignment_id}`);
  }
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
  const { error } = await applyStreakFreezeWithBalance(supabase, {
    studentId: parsed.data.student_id,
    freezeDate: parsed.data.freeze_date,
    reason: parsed.data.reason || null,
    createdBy: profile?.id ?? null,
  });

  if (error) return { error, success: false };

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function useStudentStreakFreeze(
  studentId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireStudent();
  const student = await getStudentForProfile(profile.id);

  if (!student || student.id !== studentId) {
    return { error: "Unauthorized", success: false };
  }

  const parsed = streakFreezeSchema.safeParse({
    student_id: studentId,
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
  const { error } = await applyStreakFreezeWithBalance(supabase, {
    studentId: parsed.data.student_id,
    freezeDate: parsed.data.freeze_date,
    reason: parsed.data.reason || "Student-applied freeze",
    createdBy: profile.id,
  });

  if (error) return { error, success: false };

  revalidatePath("/dashboard");
  revalidatePath("/parent");
  return { error: null, success: true };
}
