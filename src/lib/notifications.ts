import { cookies } from "next/headers";
import { getParentForProfile, getStudentForProfile } from "@/lib/auth";
import { NOTIFICATION_BASELINE_COOKIE } from "@/lib/login-history";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

export interface NotificationSummary {
  baseline: string | null;
  newMessages: number;
  newComments: number;
  navBadges: Partial<Record<string, number>>;
}

const emptySummary = (baseline: string | null = null): NotificationSummary => ({
  baseline,
  newMessages: 0,
  newComments: 0,
  navBadges: {},
});

function withBadges(
  summary: Omit<NotificationSummary, "navBadges">,
  role: UserRole
): NotificationSummary {
  const navBadges: Partial<Record<string, number>> = {};

  if (summary.newMessages > 0) {
    if (role === "student") navBadges["/dashboard/messages"] = summary.newMessages;
    if (role === "parent") navBadges["/parent/messages"] = summary.newMessages;
    if (role === "admin") navBadges["/admin/messages"] = summary.newMessages;
  }

  if (summary.newComments > 0) {
    if (role === "student") navBadges["/dashboard"] = summary.newComments;
    if (role === "parent") navBadges["/parent"] = summary.newComments;
    if (role === "admin") navBadges["/admin"] = summary.newComments;
  }

  return { ...summary, navBadges };
}

async function getBaseline(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(NOTIFICATION_BASELINE_COOKIE)?.value;
  if (!value) return null;
  return value;
}

async function countNewMessages(
  studentIds: string[],
  profileId: string,
  baseline: string | null
): Promise<number> {
  if (!baseline || studentIds.length === 0) return 0;

  const supabase = await createClient();
  let query = supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("student_id", studentIds)
    .neq("author_id", profileId)
    .gt("created_at", baseline);

  const { count, error } = await query;
  if (error) {
    console.error("Failed to count new messages:", error.message);
    return 0;
  }

  return count ?? 0;
}

async function countNewComments(
  studentIds: string[],
  profileId: string,
  role: UserRole,
  baseline: string | null
): Promise<number> {
  if (!baseline || studentIds.length === 0) return 0;

  const supabase = await createClient();
  let query = supabase
    .from("tutor_comments")
    .select("id", { count: "exact", head: true })
    .in("student_id", studentIds)
    .neq("author_id", profileId);

  if (role === "student") {
    query = query.eq("visible_to_student", true);
  } else if (role === "parent") {
    query = query.eq("visible_to_parent", true);
  }

  query = query.gt("created_at", baseline);

  const { count, error } = await query;
  if (error) {
    console.error("Failed to count new comments:", error.message);
    return 0;
  }

  return count ?? 0;
}

async function getStudentIdsForProfile(profile: Profile): Promise<string[]> {
  if (profile.role === "student") {
    const student = await getStudentForProfile(profile.id);
    return student ? [student.id] : [];
  }

  if (profile.role === "parent") {
    const supabase = await createClient();
    const parent = await getParentForProfile(profile.id);
    if (!parent) return [];

    const { data: links } = await supabase
      .from("parent_student_links")
      .select("student_id")
      .eq("parent_id", parent.id);

    return (links ?? []).map((link) => link.student_id);
  }

  if (profile.role === "admin") {
    const supabase = await createClient();
    const { data: students } = await supabase.from("students").select("id");
    return (students ?? []).map((student) => student.id);
  }

  return [];
}

export async function getNotificationSummary(
  profile: Profile
): Promise<NotificationSummary> {
  const baseline = await getBaseline();
  const studentIds = await getStudentIdsForProfile(profile);

  if (studentIds.length === 0 && profile.role !== "admin") {
    return emptySummary(baseline);
  }

  const [newMessages, newComments] = await Promise.all([
    countNewMessages(studentIds, profile.id, baseline),
    countNewComments(studentIds, profile.id, profile.role, baseline),
  ]);

  return withBadges(
    {
      baseline,
      newMessages,
      newComments,
    },
    profile.role
  );
}

export function hasNotifications(summary: NotificationSummary): boolean {
  return summary.newMessages > 0 || summary.newComments > 0;
}
