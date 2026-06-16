"use server";

import { createClient } from "@/lib/supabase/server";
import { messageSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { getProfile, canAccessStudent } from "@/lib/auth";

type ActionState = { error: string | null; success: boolean };

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

  revalidatePath("/dashboard/messages");
  revalidatePath("/parent/messages");
  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${studentId}`);
  revalidatePath(`/admin/students/${studentId}`);
  return { error: null, success: true };
}
