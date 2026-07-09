import { getLinkedParentRecipients } from "@/lib/email/parent-recipients";
import { escapeHtml, getSiteOrigin, sendEmail } from "@/lib/email/resend";
import type { createClient } from "@/lib/supabase/server";

export interface ParentHomeworkSubmittedEmailPayload {
  parentEmail: string;
  parentName: string;
  studentName: string;
  homeworkTitle: string;
  dueDate: string | null;
  submissionText: string;
}

function buildParentHomeworkSubmittedEmail(
  payload: ParentHomeworkSubmittedEmailPayload
) {
  const homeworkUrl = `${getSiteOrigin()}/parent/homework`;
  const dueLine = payload.dueDate ? `Due date: ${payload.dueDate}\n` : "";

  const text = [
    `Hi ${payload.parentName},`,
    "",
    `${payload.studentName} submitted homework.`,
    "",
    `Assignment: ${payload.homeworkTitle}`,
    dueLine.trim(),
    "",
    "Submission:",
    payload.submissionText,
    "",
    `View homework: ${homeworkUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const dueHtml = payload.dueDate
    ? `<p><strong>Due date:</strong> ${escapeHtml(payload.dueDate)}</p>`
    : "";

  const html = `
    <p>Hi ${escapeHtml(payload.parentName)},</p>
    <p><strong>${escapeHtml(payload.studentName)}</strong> submitted homework.</p>
    <p><strong>Assignment:</strong> ${escapeHtml(payload.homeworkTitle)}</p>
    ${dueHtml}
    <p><strong>Submission:</strong></p>
    <pre style="white-space:pre-wrap;font-family:inherit;background:#f8fafc;padding:12px;border-radius:8px;">${escapeHtml(
      payload.submissionText
    )}</pre>
    <p><a href="${homeworkUrl}">View homework in TutorCheck</a></p>
  `.trim();

  return {
    subject: `${payload.studentName} submitted homework: ${payload.homeworkTitle}`,
    text,
    html,
  };
}

export async function notifyParentHomeworkSubmitted(
  payload: ParentHomeworkSubmittedEmailPayload
): Promise<void> {
  await sendEmail(
    [payload.parentEmail],
    buildParentHomeworkSubmittedEmail(payload),
    "Parent homework submission email skipped"
  );
}

export async function notifyLinkedParentsHomeworkSubmitted(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string,
  payload: Omit<ParentHomeworkSubmittedEmailPayload, "parentEmail" | "parentName">
): Promise<void> {
  const parents = await getLinkedParentRecipients(supabase, studentId);
  if (parents.length === 0) {
    console.warn(
      "Parent homework submission email skipped: no linked parents with email"
    );
    return;
  }

  await Promise.all(
    parents.map((parent) =>
      notifyParentHomeworkSubmitted({
        ...payload,
        parentEmail: parent.email,
        parentName: parent.displayName,
      })
    )
  );
}
