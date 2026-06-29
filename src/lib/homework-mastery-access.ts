import { getProfile, getStudentForProfile } from "@/lib/auth";
import { parseHomeworkMasterySession } from "@/lib/homework-mastery";
import { createClient } from "@/lib/supabase/server";

export async function assertStudentMasteryHomeworkAccess(homeworkId: string) {
  const profile = await getProfile();
  if (!profile || profile.role !== "student") {
    return { error: "Unauthorized", homework: null as null };
  }

  const student = await getStudentForProfile(profile.id);
  if (!student) {
    return { error: "Unauthorized", homework: null as null };
  }

  const supabase = await createClient();
  const { data: homework, error } = await supabase
    .from("homework_assignments")
    .select(
      "id, student_id, title, mandate_ai_mastery, mastery_source_type, mastery_source_text, mastery_source_url, mastery_session, status, submission_text, completed_at"
    )
    .eq("id", homeworkId)
    .maybeSingle();

  if (error || !homework) {
    return { error: "Homework assignment not found.", homework: null as null };
  }

  if (homework.student_id !== student.id) {
    return { error: "Unauthorized", homework: null as null };
  }

  if (!homework.mandate_ai_mastery) {
    return {
      error: "This assignment does not require an AI mastery check.",
      homework: null as null,
    };
  }

  return {
    error: null,
    homework: {
      ...homework,
      mastery_session: parseHomeworkMasterySession(homework.mastery_session),
    },
  };
}
