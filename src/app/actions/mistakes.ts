"use server";

import { createClient } from "@/lib/supabase/server";
import { mistakeLabelSchema, mistakeSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { getProfile, canAccessStudent } from "@/lib/auth";

type ActionState = { error: string | null; success: boolean };

function revalidateMistakePaths(studentId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/mistakes");
  revalidatePath("/parent");
  revalidatePath("/admin");
  revalidatePath(`/admin/students/${studentId}`);
}

export async function createMistake(
  studentId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await getProfile();
  if (!profile || !(await canAccessStudent(profile, studentId))) {
    return { error: "Unauthorized", success: false };
  }

  if (profile.role === "parent") {
    return { error: "Parents cannot record mistakes.", success: false };
  }

  const parsed = mistakeSchema.safeParse({
    mistake_date: formData.get("mistake_date"),
    question_prompt: formData.get("question_prompt") || undefined,
    topic: formData.get("topic") || undefined,
    mistake_label_id: formData.get("mistake_label_id") || null,
    new_label_name: formData.get("new_label_name") || undefined,
    explanation: formData.get("explanation") || undefined,
    lesson_learned: formData.get("lesson_learned") || undefined,
    study_log_id: formData.get("study_log_id") || null,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const supabase = await createClient();
  let labelId = parsed.data.mistake_label_id || null;

  if (parsed.data.new_label_name?.trim()) {
    const { data: label, error: labelError } = await supabase
      .from("mistake_labels")
      .upsert(
        {
          student_id: studentId,
          name: parsed.data.new_label_name.trim(),
        },
        { onConflict: "student_id,name" }
      )
      .select("id")
      .single();

    if (labelError) return { error: labelError.message, success: false };
    labelId = label.id;
  }

  const { error } = await supabase.from("mistakes").insert({
    student_id: studentId,
    study_log_id: parsed.data.study_log_id || null,
    mistake_date: parsed.data.mistake_date,
    question_prompt: parsed.data.question_prompt || null,
    topic: parsed.data.topic || null,
    mistake_label_id: labelId,
    explanation: parsed.data.explanation || null,
    lesson_learned: parsed.data.lesson_learned || null,
  });

  if (error) return { error: error.message, success: false };

  revalidateMistakePaths(studentId);
  return { error: null, success: true };
}

export async function createMistakeLabel(
  studentId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return { error: "Unauthorized", success: false };
  }

  const parsed = mistakeLabelSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("mistake_labels").upsert(
    {
      student_id: studentId,
      name: parsed.data.name,
    },
    { onConflict: "student_id,name" }
  );

  if (error) return { error: error.message, success: false };

  revalidateMistakePaths(studentId);
  return { error: null, success: true };
}

export async function deleteMistakeLabel(
  studentId: string,
  labelId: string
): Promise<ActionState> {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return { error: "Unauthorized", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("mistake_labels")
    .delete()
    .eq("id", labelId)
    .eq("student_id", studentId);

  if (error) return { error: error.message, success: false };

  revalidateMistakePaths(studentId);
  return { error: null, success: true };
}
