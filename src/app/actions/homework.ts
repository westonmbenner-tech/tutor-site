"use server";

import { createClient } from "@/lib/supabase/server";
import { homeworkSchema, homeworkUpdateSchema, commentSchema, commentReplySchema, homeworkCommentSchema, streakFreezeSchema, homeworkSubmissionSchema } from "@/lib/validations";
import { applyStreakFreezeWithBalance } from "@/lib/streak-freezes";
import { notifyAdminHomeworkComment, notifyAdminHomeworkSubmission } from "@/lib/email/admin-notifications";
import {
  notifyStudentHomeworkAssigned,
  notifyStudentHomeworkTutorComment,
} from "@/lib/email/student-notifications";
import { masterySessionPassed } from "@/lib/homework-mastery";
import { getStudentRecipient } from "@/lib/email/student-recipients";
import { revalidatePath } from "next/cache";
import { getProfile, requireAdmin, canAccessStudent, getStudentForProfile, requireStudent } from "@/lib/auth";
import type { Profile } from "@/lib/types";

type ActionState = { error: string | null; success: boolean };

function parseJsonField(value: string | undefined, fallback: unknown[] = []) {
  if (!value?.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseMasteryFieldsFromForm(formData: FormData) {
  const mandate_ai_mastery = formData.get("mandate_ai_mastery") === "on";
  const rawType = formData.get("mastery_source_type");
  const mastery_source_type =
    mandate_ai_mastery && (rawType === "text" || rawType === "url")
      ? rawType
      : null;

  return {
    mandate_ai_mastery,
    mastery_source_type,
    mastery_source_text:
      mandate_ai_mastery && mastery_source_type === "text"
        ? String(formData.get("mastery_source_text") ?? "").trim() || null
        : null,
    mastery_source_url:
      mandate_ai_mastery && mastery_source_type === "url"
        ? String(formData.get("mastery_source_url") ?? "").trim() || null
        : null,
  };
}

export async function createHomework(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const profile = await getProfile();

  const parsed = homeworkSchema.safeParse({
    student_id: formData.get("student_id"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    description_format: formData.get("description_format") || "plain",
    due_date: formData.get("due_date") || null,
    links: formData.get("links") || undefined,
    attachments: formData.get("attachments") || undefined,
    ...parseMasteryFieldsFromForm(formData),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const supabase = await createClient();
  const { data: homework, error } = await supabase
    .from("homework_assignments")
    .insert({
      student_id: parsed.data.student_id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      description_format: parsed.data.description_format ?? "plain",
      due_date: parsed.data.due_date || null,
      links: parseJsonField(parsed.data.links),
      attachments: parseJsonField(parsed.data.attachments),
      created_by: profile?.id,
      status: "assigned",
      mandate_ai_mastery: parsed.data.mandate_ai_mastery ?? false,
      mastery_source_type: parsed.data.mastery_source_type ?? null,
      mastery_source_text: parsed.data.mastery_source_text ?? null,
      mastery_source_url: parsed.data.mastery_source_url ?? null,
    })
    .select("id, title, description, due_date")
    .single();

  if (error) return { error: error.message, success: false };

  notifyStudentHomeworkAssignedIfPossible(
    supabase,
    parsed.data.student_id,
    {
      title: homework.title,
      description: homework.description,
      dueDate: homework.due_date,
    }
  ).catch((emailError) => {
    console.error("Homework assigned email failed:", emailError);
  });

  revalidatePath("/admin");
  revalidatePath("/admin/homework");
  revalidatePath("/dashboard/homework");
  return { error: null, success: true };
}

function revalidateHomeworkPaths(homeworkId?: string, studentId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/homework");
  if (homeworkId) {
    revalidatePath(`/admin/homework/${homeworkId}`);
  }
  if (studentId) {
    revalidatePath(`/admin/students/${studentId}`);
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/homework");
  revalidatePath("/parent");
  revalidatePath("/parent/homework");
}

export async function updateHomework(
  homeworkId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = homeworkUpdateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    description_format: formData.get("description_format") || "plain",
    due_date: formData.get("due_date") || null,
    links: formData.get("links") || undefined,
    attachments: formData.get("attachments") || undefined,
    status: formData.get("status") || undefined,
    ...parseMasteryFieldsFromForm(formData),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("homework_assignments")
    .select("student_id")
    .eq("id", homeworkId)
    .maybeSingle();

  if (!existing) {
    return { error: "Homework assignment not found.", success: false };
  }

  const { error } = await supabase
    .from("homework_assignments")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      description_format: parsed.data.description_format ?? "plain",
      due_date: parsed.data.due_date || null,
      links: parseJsonField(parsed.data.links),
      attachments: parseJsonField(parsed.data.attachments),
      status: parsed.data.status ?? "assigned",
      mandate_ai_mastery: parsed.data.mandate_ai_mastery ?? false,
      mastery_source_type: parsed.data.mastery_source_type ?? null,
      mastery_source_text: parsed.data.mastery_source_text ?? null,
      mastery_source_url: parsed.data.mastery_source_url ?? null,
    })
    .eq("id", homeworkId);

  if (error) return { error: error.message, success: false };

  revalidateHomeworkPaths(homeworkId, existing.student_id);
  return { error: null, success: true };
}

export async function deleteHomework(
  homeworkId: string
): Promise<ActionState> {
  await requireAdmin();

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("homework_assignments")
    .select("student_id")
    .eq("id", homeworkId)
    .maybeSingle();

  if (!existing) {
    return { error: "Homework assignment not found.", success: false };
  }

  const { error } = await supabase
    .from("homework_assignments")
    .delete()
    .eq("id", homeworkId);

  if (error) return { error: error.message, success: false };

  revalidateHomeworkPaths(undefined, existing.student_id);
  return { error: null, success: true };
}

async function assertStudentSubmissionAccess(homeworkId: string) {
  const profile = await getProfile();
  if (!profile) {
    return { error: "Unauthorized", profile: null, hw: null };
  }

  if (profile.role !== "student") {
    return {
      error: "Only students can manage their homework submission.",
      profile: null,
      hw: null,
    };
  }

  const student = await getStudentForProfile(profile.id);
  if (!student) {
    return { error: "Unauthorized", profile: null, hw: null };
  }

  const supabase = await createClient();
  const { data: hw } = await supabase
    .from("homework_assignments")
    .select("id, student_id, status, submission_text")
    .eq("id", homeworkId)
    .maybeSingle();

  if (!hw || hw.student_id !== student.id) {
    return { error: "Homework assignment not found.", profile: null, hw: null };
  }

  return { error: null, profile, hw };
}

export async function updateHomeworkSubmission(
  homeworkId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const access = await assertStudentSubmissionAccess(homeworkId);
  if (!access.hw) {
    return { error: access.error ?? "Unauthorized", success: false };
  }

  if (access.hw.status !== "completed" && !access.hw.submission_text) {
    return { error: "There is no submission to edit yet.", success: false };
  }

  const parsed = homeworkSubmissionSchema.safeParse({
    submission_text: formData.get("submission_text"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("homework_assignments")
    .update({
      submission_text: parsed.data.submission_text,
      status: "completed",
    })
    .eq("id", homeworkId);

  if (error) return { error: error.message, success: false };

  revalidateHomeworkPaths(homeworkId, access.hw.student_id);
  return { error: null, success: true };
}

export async function clearHomeworkSubmission(
  homeworkId: string
): Promise<ActionState> {
  const access = await assertStudentSubmissionAccess(homeworkId);
  if (!access.hw) {
    return { error: access.error ?? "Unauthorized", success: false };
  }

  if (access.hw.status !== "completed" && !access.hw.submission_text) {
    return { error: "There is no submission to remove.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("homework_assignments")
    .update({
      status: "assigned",
      submission_text: null,
      completed_at: null,
    })
    .eq("id", homeworkId);

  if (error) return { error: error.message, success: false };

  revalidateHomeworkPaths(homeworkId, access.hw.student_id);
  return { error: null, success: true };
}

export async function completeHomework(
  homeworkId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await getProfile();
  if (!profile) {
    return { error: "Unauthorized", success: false };
  }

  const parsed = homeworkSubmissionSchema.safeParse({
    submission_text: formData.get("submission_text"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const supabase = await createClient();
  const { data: hw } = await supabase
    .from("homework_assignments")
    .select(
      "student_id, title, due_date, mandate_ai_mastery, mastery_session, students(display_name)"
    )
    .eq("id", homeworkId)
    .single();

  if (!hw || !(await canAccessStudent(profile, hw.student_id))) {
    return { error: "Unauthorized", success: false };
  }

  if (profile.role === "student" && hw.mandate_ai_mastery) {
    if (!masterySessionPassed(hw.mastery_session)) {
      return {
        error: "Complete the AI mastery check before submitting homework.",
        success: false,
      };
    }
  }

  const { error } = await supabase
    .from("homework_assignments")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      submission_text: parsed.data.submission_text,
    })
    .eq("id", homeworkId);

  if (error) return { error: error.message, success: false };

  if (profile.role === "student") {
    const studentName =
      (hw.students as { display_name?: string } | null)?.display_name ??
      profile.full_name ??
      "Student";

    notifyAdminHomeworkSubmission({
      studentName,
      homeworkTitle: hw.title,
      dueDate: hw.due_date,
      submissionText: parsed.data.submission_text,
      homeworkId,
      studentId: hw.student_id,
    }).catch((emailError) => {
      console.error("Homework submission email failed:", emailError);
    });
  }

  revalidateHomeworkPaths(homeworkId, hw.student_id);
  return { error: null, success: true };
}

export async function createTutorComment(
  studentId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const profile = await getProfile();

  const parsed = commentSchema.safeParse({
    student_id: studentId,
    study_log_id: formData.get("study_log_id") || null,
    homework_assignment_id: formData.get("homework_assignment_id") || null,
    comment: formData.get("comment"),
    visible_to_student: formData.get("visible_to_student") === "on",
    visible_to_parent: formData.get("visible_to_parent") === "on",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tutor_comments").insert({
    student_id: parsed.data.student_id,
    study_log_id: parsed.data.study_log_id || null,
    homework_assignment_id: parsed.data.homework_assignment_id || null,
    author_id: profile!.id,
    comment: parsed.data.comment,
    visible_to_student: parsed.data.visible_to_student,
    visible_to_parent: parsed.data.visible_to_parent,
  });

  if (error) return { error: error.message, success: false };

  if (
    parsed.data.homework_assignment_id &&
    parsed.data.visible_to_student
  ) {
    notifyStudentHomeworkTutorCommentIfPossible(
      supabase,
      studentId,
      parsed.data.homework_assignment_id,
      parsed.data.comment
    ).catch((emailError) => {
      console.error("Homework tutor comment email failed:", emailError);
    });
  }

  revalidateCommentPaths(studentId, parsed.data.homework_assignment_id);
  return { error: null, success: true };
}

async function homeworkIsSubmitted(
  supabase: Awaited<ReturnType<typeof createClient>>,
  homeworkId: string,
  studentId: string
) {
  const { data: homework } = await supabase
    .from("homework_assignments")
    .select("id, status, completed_at, submission_text")
    .eq("id", homeworkId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (!homework) return false;

  return (
    homework.status === "completed" ||
    Boolean(homework.completed_at) ||
    Boolean(homework.submission_text?.trim())
  );
}

export async function createHomeworkComment(
  studentId: string,
  homeworkAssignmentId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await getProfile();
  if (!profile || !(await canAccessStudent(profile, studentId))) {
    return { error: "Unauthorized", success: false };
  }

  if (profile.role !== "student" && profile.role !== "parent") {
    return { error: "Unauthorized", success: false };
  }

  const parsed = homeworkCommentSchema.safeParse({
    homework_assignment_id: homeworkAssignmentId,
    comment: formData.get("comment"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  if (parsed.data.homework_assignment_id !== homeworkAssignmentId) {
    return { error: "Invalid homework assignment.", success: false };
  }

  const supabase = await createClient();

  if (!(await homeworkIsSubmitted(supabase, homeworkAssignmentId, studentId))) {
    if (profile.role !== "parent") {
      return {
        error: "Comments are available after homework is submitted.",
        success: false,
      };
    }
  }

  const visible_to_student = true;
  const visible_to_parent = true;

  const { error } = await supabase.from("tutor_comments").insert({
    student_id: studentId,
    homework_assignment_id: homeworkAssignmentId,
    study_log_id: null,
    parent_comment_id: null,
    author_id: profile.id,
    comment: parsed.data.comment,
    visible_to_student,
    visible_to_parent,
  });

  if (error) return { error: error.message, success: false };

  notifyAdminHomeworkCommentForReply(
    profile,
    studentId,
    homeworkAssignmentId,
    parsed.data.comment
  ).catch((emailError) => {
    console.error("Homework comment email failed:", emailError);
  });

  revalidateCommentPaths(studentId, homeworkAssignmentId);
  return { error: null, success: true };
}

function revalidateCommentPaths(
  studentId: string,
  homeworkAssignmentId?: string | null
) {
  revalidatePath("/admin");
  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath("/admin/homework");
  if (homeworkAssignmentId) {
    revalidatePath(`/admin/homework/${homeworkAssignmentId}`);
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/homework");
  revalidatePath("/parent");
  revalidatePath("/parent/homework");
  revalidatePath("/parent/ai-summary");
}

async function getCommentThreadRoot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  commentId: string
) {
  type CommentRow = {
    id: string;
    parent_comment_id: string | null;
    visible_to_student: boolean;
    visible_to_parent: boolean;
    study_log_id: string | null;
    homework_assignment_id: string | null;
    student_id: string;
  };

  let currentId: string | null = commentId;
  let current: CommentRow | null = null;

  while (currentId) {
    const { data } = await supabase
      .from("tutor_comments")
      .select(
        "id, parent_comment_id, visible_to_student, visible_to_parent, study_log_id, homework_assignment_id, student_id"
      )
      .eq("id", currentId)
      .maybeSingle();

    if (!data) return null;
    current = data as CommentRow;
    currentId = current.parent_comment_id;
  }

  return current;
}

async function notifyAdminHomeworkCommentForReply(
  profile: Profile,
  studentId: string,
  homeworkAssignmentId: string,
  commentText: string
) {
  if (profile.role !== "student" && profile.role !== "parent") {
    return;
  }

  const supabase = await createClient();
  const { data: homework } = await supabase
    .from("homework_assignments")
    .select("id, title, students(display_name)")
    .eq("id", homeworkAssignmentId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (!homework) return;

  const studentName =
    (homework.students as { display_name?: string } | null)?.display_name ??
    "Student";
  const authorName = profile.full_name?.trim() || studentName;

  await notifyAdminHomeworkComment({
    authorRole: profile.role,
    authorName,
    studentName,
    homeworkTitle: homework.title,
    commentText,
    homeworkId: homework.id,
  });
}

async function notifyStudentHomeworkAssignedIfPossible(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string,
  homework: {
    title: string;
    description: string | null;
    dueDate: string | null;
  }
) {
  const recipient = await getStudentRecipient(supabase, studentId);
  if (!recipient) return;

  await notifyStudentHomeworkAssigned({
    studentEmail: recipient.email,
    studentName: recipient.displayName,
    homeworkTitle: homework.title,
    description: homework.description,
    dueDate: homework.dueDate,
  });
}

async function notifyStudentHomeworkTutorCommentIfPossible(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string,
  homeworkAssignmentId: string,
  commentText: string
) {
  const [recipient, homeworkResult] = await Promise.all([
    getStudentRecipient(supabase, studentId),
    supabase
      .from("homework_assignments")
      .select("title")
      .eq("id", homeworkAssignmentId)
      .eq("student_id", studentId)
      .maybeSingle(),
  ]);

  if (!recipient || !homeworkResult.data) return;

  await notifyStudentHomeworkTutorComment({
    studentEmail: recipient.email,
    studentName: recipient.displayName,
    homeworkTitle: homeworkResult.data.title,
    commentText,
  });
}

export async function replyToComment(
  studentId: string,
  parentCommentId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await getProfile();
  if (!profile || !(await canAccessStudent(profile, studentId))) {
    return { error: "Unauthorized", success: false };
  }

  const parsed = commentReplySchema.safeParse({
    comment: formData.get("comment"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const supabase = await createClient();

  const { data: immediateParent } = await supabase
    .from("tutor_comments")
    .select(
      "id, visible_to_student, visible_to_parent, student_id, study_log_id, homework_assignment_id"
    )
    .eq("id", parentCommentId)
    .maybeSingle();

  if (!immediateParent || immediateParent.student_id !== studentId) {
    return { error: "Comment thread not found.", success: false };
  }

  const threadRoot = await getCommentThreadRoot(supabase, parentCommentId);

  if (!threadRoot) {
    return { error: "Comment thread not found.", success: false };
  }

  if (profile.role === "student" && !immediateParent.visible_to_student) {
    return { error: "You cannot reply to this comment.", success: false };
  }

  if (profile.role === "parent" && !immediateParent.visible_to_parent) {
    return { error: "You cannot reply to this comment.", success: false };
  }

  const visible_to_student =
    profile.role === "admin"
      ? formData.get("visible_to_student") === "on" ||
        threadRoot.visible_to_student
      : profile.role === "student"
        ? true
        : threadRoot.visible_to_student;

  const visible_to_parent =
    profile.role === "admin"
      ? formData.get("visible_to_parent") === "on" ||
        threadRoot.visible_to_parent
      : profile.role === "parent"
        ? true
        : threadRoot.visible_to_parent;

  const { error } = await supabase.from("tutor_comments").insert({
    student_id: studentId,
    study_log_id: immediateParent.study_log_id,
    homework_assignment_id: immediateParent.homework_assignment_id,
    parent_comment_id: parentCommentId,
    author_id: profile.id,
    comment: parsed.data.comment,
    visible_to_student,
    visible_to_parent,
  });

  if (error) return { error: error.message, success: false };

  if (
    (profile.role === "student" || profile.role === "parent") &&
    immediateParent.homework_assignment_id
  ) {
    notifyAdminHomeworkCommentForReply(
      profile,
      studentId,
      immediateParent.homework_assignment_id,
      parsed.data.comment
    ).catch((emailError) => {
      console.error("Homework comment email failed:", emailError);
    });
  }

  if (
    profile.role === "admin" &&
    immediateParent.homework_assignment_id &&
    visible_to_student
  ) {
    notifyStudentHomeworkTutorCommentIfPossible(
      supabase,
      studentId,
      immediateParent.homework_assignment_id,
      parsed.data.comment
    ).catch((emailError) => {
      console.error("Homework tutor comment email failed:", emailError);
    });
  }

  revalidateCommentPaths(studentId, immediateParent.homework_assignment_id);
  return { error: null, success: true };
}

export async function applyStreakFreeze(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const profile = await getProfile();

  const parsed = streakFreezeSchema.safeParse({
    student_id: formData.get("student_id"),
    freeze_date: formData.get("freeze_date"),
    reason: formData.get("reason") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const supabase = await createClient();
  const { error } = await applyStreakFreezeWithBalance(supabase, {
    studentId: parsed.data.student_id,
    freezeDate: parsed.data.freeze_date,
    reason: parsed.data.reason || null,
    createdBy: profile?.id ?? null,
  });

  if (error) return { error, success: false };

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function useStudentStreakFreeze(
  studentId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireStudent();
  const student = await getStudentForProfile(profile.id);

  if (!student || student.id !== studentId) {
    return { error: "Unauthorized", success: false };
  }

  const parsed = streakFreezeSchema.safeParse({
    student_id: studentId,
    freeze_date: formData.get("freeze_date"),
    reason: formData.get("reason") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const supabase = await createClient();
  const { error } = await applyStreakFreezeWithBalance(supabase, {
    studentId: parsed.data.student_id,
    freezeDate: parsed.data.freeze_date,
    reason: parsed.data.reason || "Student-applied freeze",
    createdBy: profile.id,
  });

  if (error) return { error, success: false };

  revalidatePath("/dashboard");
  revalidatePath("/parent");
  return { error: null, success: true };
}
