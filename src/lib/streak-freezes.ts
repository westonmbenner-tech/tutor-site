import type { SupabaseClient } from "@supabase/supabase-js";

export async function applyStreakFreezeWithBalance(
  supabase: SupabaseClient,
  {
    studentId,
    freezeDate,
    reason,
    createdBy,
  }: {
    studentId: string;
    freezeDate: string;
    reason?: string | null;
    createdBy?: string | null;
  }
): Promise<{ error: string | null }> {
  const { data: existing } = await supabase
    .from("streak_freezes")
    .select("id")
    .eq("student_id", studentId)
    .eq("freeze_date", freezeDate)
    .maybeSingle();

  if (!existing) {
    const { data: student } = await supabase
      .from("students")
      .select("streak_freeze_balance")
      .eq("id", studentId)
      .single();

    const balance = student?.streak_freeze_balance ?? 0;
    if (balance <= 0) {
      return { error: "No streak freezes remaining." };
    }

    const { error: balanceError } = await supabase
      .from("students")
      .update({ streak_freeze_balance: balance - 1 })
      .eq("id", studentId);

    if (balanceError) return { error: balanceError.message };
  }

  const { error } = await supabase.from("streak_freezes").upsert(
    {
      student_id: studentId,
      freeze_date: freezeDate,
      reason: reason || null,
      created_by: createdBy ?? null,
    },
    { onConflict: "student_id,freeze_date" }
  );

  return { error: error?.message ?? null };
}
