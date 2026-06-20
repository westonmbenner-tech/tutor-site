import type { createClient } from "@/lib/supabase/server";

export interface StudentRecipient {
  email: string;
  displayName: string;
}

export async function getStudentRecipient(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string
): Promise<StudentRecipient | null> {
  const { data } = await supabase
    .from("students")
    .select("display_name, profiles(email, full_name)")
    .eq("id", studentId)
    .maybeSingle();

  if (!data) return null;

  const profile = data.profiles as {
    email?: string | null;
    full_name?: string | null;
  } | null;
  const email = profile?.email?.trim();

  if (!email) return null;

  return {
    email,
    displayName:
      data.display_name?.trim() ||
      profile?.full_name?.trim() ||
      "Student",
  };
}
