import { createClient } from "@/lib/supabase/server";
import {
  computeWeeklyProgress,
  computeWeeklyStreak,
  resolveHomeworkStatuses,
  formatDateISO,
} from "@/lib/streak";
import {
  aggregateStudyStats,
  buildAccuracyTrend,
  detectAttentionFlags,
  countMistakeLabels,
} from "@/lib/analytics";
import type {
  HomeworkAssignment,
  Mistake,
  StudyLog,
  StreakFreeze,
  Student,
} from "@/lib/types";

export async function fetchStudentBundle(studentId: string) {
  const supabase = await createClient();

  const [
    { data: student },
    { data: logs },
    { data: homework },
    { data: mistakes },
    { data: labels },
    { data: freezes },
    { data: comments },
    { data: aiSummaries },
  ] = await Promise.all([
    supabase.from("students").select("*").eq("id", studentId).single(),
    supabase
      .from("study_logs")
      .select("*")
      .eq("student_id", studentId)
      .order("log_date", { ascending: false }),
    supabase
      .from("homework_assignments")
      .select("*")
      .eq("student_id", studentId)
      .order("due_date", { ascending: true }),
    supabase
      .from("mistakes")
      .select("*, mistake_labels(*)")
      .eq("student_id", studentId)
      .order("mistake_date", { ascending: false }),
    supabase
      .from("mistake_labels")
      .select("*")
      .eq("student_id", studentId)
      .order("name"),
    supabase
      .from("streak_freezes")
      .select("*")
      .eq("student_id", studentId)
      .order("freeze_date", { ascending: false }),
    supabase
      .from("tutor_comments")
      .select("*, profiles(full_name)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
    supabase
      .from("ai_mistake_summaries")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const studyLogs = (logs ?? []) as StudyLog[];
  const streakFreezes = (freezes ?? []) as StreakFreeze[];
  const progress = computeWeeklyProgress(studyLogs, streakFreezes);
  const streakCount = computeWeeklyStreak(studyLogs, streakFreezes);
  const resolvedHomework = resolveHomeworkStatuses(
    (homework ?? []) as HomeworkAssignment[]
  );
  const stats = aggregateStudyStats(studyLogs);
  const accuracyTrend = buildAccuracyTrend(studyLogs);
  const attentionFlags = detectAttentionFlags(
    studyLogs,
    (homework ?? []) as HomeworkAssignment[],
    resolvedHomework
  );
  const commonLabels = countMistakeLabels((mistakes ?? []) as Mistake[]);

  const today = formatDateISO(new Date());
  const todayLog = studyLogs.find((l) => l.log_date === today) ?? null;

  return {
    student: student as Student,
    studyLogs,
    homework: resolvedHomework,
    mistakes: (mistakes ?? []) as Mistake[],
    labels: labels ?? [],
    freezes: streakFreezes,
    comments: comments ?? [],
    aiSummaries: aiSummaries ?? [],
    progress,
    streakCount,
    stats,
    accuracyTrend,
    attentionFlags,
    commonLabels,
    todayLog,
  };
}

export async function fetchAllStudentsOverview() {
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("students")
    .select("*")
    .eq("active", true)
    .order("display_name");

  if (!students?.length) return [];

  const overviews = await Promise.all(
    students.map(async (s) => {
      const bundle = await fetchStudentBundle(s.id);
      return {
        student: s as Student,
        progress: bundle.progress,
        streakCount: bundle.streakCount,
        stats: bundle.stats,
        attentionFlags: bundle.attentionFlags,
        homeworkSummary: {
          assigned: bundle.homework.filter((h) => h.resolved_status === "assigned")
            .length,
          overdue: bundle.homework.filter(
            (h) =>
              h.resolved_status === "missing" || h.resolved_status === "late"
          ).length,
          completed: bundle.homework.filter(
            (h) => h.resolved_status === "completed"
          ).length,
        },
        commonLabels: bundle.commonLabels.slice(0, 3),
      };
    })
  );

  return overviews;
}

export async function fetchParentStudents(parentProfileId: string) {
  const supabase = await createClient();
  const { data: parent } = await supabase
    .from("parents")
    .select("id")
    .eq("profile_id", parentProfileId)
    .single();

  if (!parent) return [];

  const { data: links } = await supabase
    .from("parent_student_links")
    .select("student_id")
    .eq("parent_id", parent.id);

  if (!links?.length) return [];

  return Promise.all(
    links.map(async (l) => fetchStudentBundle(l.student_id))
  );
}
