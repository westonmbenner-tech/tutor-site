"use server";

import { createClient } from "@/lib/supabase/server";
import { notifyAdminMessage } from "@/lib/email/admin-notifications";
import { messageSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { getProfile, canAccessStudent } from "@/lib/auth";
import type { Profile } from "@/lib/types";

type ActionState = { error: string | null; success: boolean };

async function notifyAdminMessageIfNeeded(
  profile: Profile,
  studentId: string,
  messageBody: string
) {
  if (profile.role !== "student" && profile.role !== "parent") {
    return;
  }

  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("display_name")
    .eq("id", studentId)
    .maybeSingle();

  const studentName = student?.display_name ?? "Student";
  const authorName = profile.full_name?.trim() || studentName;

  await notifyAdminMessage({
    authorRole: profile.role,
    authorName,
    studentName,
    messageBody,
    studentId,
  });
}

export async function sendMessage(
  studentId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await getProfile();
  if (!profile || !(await canAccessStudent(profile, studentId))) {
    return { error: "Unauthorized", success: false };
  }

  const parsed = messageSchema.safeParse({
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid message",
      success: false,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    student_id: studentId,
    author_id: profile.id,
    body: parsed.data.body,
  });

  if (error) return { error: error.message, success: false };

  if (profile.role === "student" || profile.role === "parent") {
    notifyAdminMessageIfNeeded(profile, studentId, parsed.data.body).catch(
      (emailError) => {
        console.error("Message email failed:", emailError);
      }
    );
  }

  revalidatePath("/dashboard/messages");
  revalidatePath("/parent/messages");
  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${studentId}`);
  revalidatePath(`/admin/students/${studentId}`);
  return { error: null, success: true };
}
