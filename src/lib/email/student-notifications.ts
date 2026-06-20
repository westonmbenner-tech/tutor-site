import { escapeHtml, getSiteOrigin, sendEmail } from "@/lib/email/resend";

export interface HomeworkAssignedEmailPayload {
  studentEmail: string;
  studentName: string;
  homeworkTitle: string;
  description: string | null;
  dueDate: string | null;
}

export interface HomeworkTutorCommentEmailPayload {
  studentEmail: string;
  studentName: string;
  homeworkTitle: string;
  commentText: string;
}

function buildHomeworkAssignedEmail(payload: HomeworkAssignedEmailPayload) {
  const homeworkUrl = `${getSiteOrigin()}/dashboard/homework`;
  const dueLine = payload.dueDate ? `Due date: ${payload.dueDate}\n` : "";
  const descriptionBlock = payload.description?.trim()
    ? `\nDetails:\n${payload.description}\n`
    : "";

  const text = [
    `Hi ${payload.studentName},`,
    "",
    `Your tutor assigned new homework: ${payload.homeworkTitle}`,
    dueLine.trim(),
    descriptionBlock.trim(),
    "",
    `View homework: ${homeworkUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const dueHtml = payload.dueDate
    ? `<p><strong>Due date:</strong> ${escapeHtml(payload.dueDate)}</p>`
    : "";
  const descriptionHtml = payload.description?.trim()
    ? `<p><strong>Details:</strong></p>
    <p style="white-space:pre-wrap;">${escapeHtml(payload.description.trim())}</p>`
    : "";

  const html = `
    <p>Hi ${escapeHtml(payload.studentName)},</p>
    <p>Your tutor assigned new homework: <strong>${escapeHtml(payload.homeworkTitle)}</strong></p>
    ${dueHtml}
    ${descriptionHtml}
    <p><a href="${homeworkUrl}">View homework in TutorCheck</a></p>
  `.trim();

  return {
    subject: `New homework: ${payload.homeworkTitle}`,
    text,
    html,
  };
}

function buildHomeworkTutorCommentEmail(
  payload: HomeworkTutorCommentEmailPayload
) {
  const homeworkUrl = `${getSiteOrigin()}/dashboard/homework`;

  const text = [
    `Hi ${payload.studentName},`,
    "",
    `Your tutor commented on homework: ${payload.homeworkTitle}`,
    "",
    "Comment:",
    payload.commentText,
    "",
    `View homework: ${homeworkUrl}`,
  ].join("\n");

  const html = `
    <p>Hi ${escapeHtml(payload.studentName)},</p>
    <p>Your tutor commented on homework: <strong>${escapeHtml(payload.homeworkTitle)}</strong></p>
    <p><strong>Comment:</strong></p>
    <pre style="white-space:pre-wrap;font-family:inherit;background:#f8fafc;padding:12px;border-radius:8px;">${escapeHtml(
      payload.commentText
    )}</pre>
    <p><a href="${homeworkUrl}">View homework in TutorCheck</a></p>
  `.trim();

  return {
    subject: `Tutor comment on homework: ${payload.homeworkTitle}`,
    text,
    html,
  };
}

export async function notifyStudentHomeworkAssigned(
  payload: HomeworkAssignedEmailPayload
): Promise<void> {
  await sendEmail(
    [payload.studentEmail],
    buildHomeworkAssignedEmail(payload),
    "Homework assigned email skipped"
  );
}

export async function notifyStudentHomeworkTutorComment(
  payload: HomeworkTutorCommentEmailPayload
): Promise<void> {
  await sendEmail(
    [payload.studentEmail],
    buildHomeworkTutorCommentEmail(payload),
    "Homework tutor comment email skipped"
  );
}
