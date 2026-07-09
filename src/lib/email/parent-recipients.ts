import type { createClient } from "@/lib/supabase/server";

export interface ParentRecipient {
  email: string;
  displayName: string;
}

export async function getLinkedParentRecipients(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string
): Promise<ParentRecipient[]> {
  const { data: links } = await supabase
    .from("parent_student_links")
    .select("parents(display_name, profiles(email, full_name))")
    .eq("student_id", studentId);

  if (!links?.length) return [];

  const seen = new Set<string>();
  const recipients: ParentRecipient[] = [];

  for (const link of links) {
    const parent = link.parents as {
      display_name?: string | null;
      profiles?: { email?: string | null; full_name?: string | null } | null;
    } | null;

    const email = parent?.profiles?.email?.trim();
    if (!email) continue;

    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    recipients.push({
      email,
      displayName:
        parent?.display_name?.trim() ||
        parent?.profiles?.full_name?.trim() ||
        "Parent",
    });
  }

  return recipients;
}
