"use server";

import { createClient } from "@/lib/supabase/server";
import { deriveCorrectCount } from "@/lib/streak";
import { studyLogSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { getProfile, canAccessStudent } from "@/lib/auth";

type ActionState = { error: string | null; success: boolean };

export async function submitStudyLog(
  studentId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await getProfile();
  if (!profile || !(await canAccessStudent(profile, studentId))) {
    return { error: "Unauthorized", success: false };
  }

  if (profile.role === "parent") {
    return { error: "Parents cannot submit study logs.", success: false };
  }

  const parsed = studyLogSchema.safeParse({
    log_date: formData.get("log_date"),
    questions_completed: formData.get("questions_completed"),
    questions_correct: formData.get("questions_correct"),
    questions_wrong: formData.get("questions_wrong"),
    topic: formData.get("topic") || undefined,
    confidence: formData.get("confidence") || null,
    errors_lessons_learned: formData.get("errors_lessons_learned") || undefined,
    miscellaneous_notes: formData.get("miscellaneous_notes") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const derived = deriveCorrectCount(
    parsed.data.questions_completed,
    parsed.data.questions_correct,
    parsed.data.questions_wrong
  );

  if (derived.error) {
    return { error: derived.error, success: false };
  }

  const supabase = await createClient();
  const payload = {
    student_id: studentId,
    log_date: parsed.data.log_date,
    questions_completed: parsed.data.questions_completed,
    questions_correct: derived.correct,
    questions_wrong: derived.wrong,
    topic: parsed.data.topic || null,
    confidence: parsed.data.confidence ?? null,
    errors_lessons_learned: parsed.data.errors_lessons_learned || null,
    miscellaneous_notes: parsed.data.miscellaneous_notes || null,
  };

  const { error } = await supabase.from("study_logs").upsert(payload, {
    onConflict: "student_id,log_date",
  });

  if (error) return { error: error.message, success: false };

  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { error: null, success: true };
}
