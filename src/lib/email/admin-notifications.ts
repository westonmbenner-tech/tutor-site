import { escapeHtml, getSiteOrigin, sendEmail } from "@/lib/email/resend";

export interface HomeworkSubmissionEmailPayload {
  studentName: string;
  homeworkTitle: string;
  dueDate: string | null;
  submissionText: string;
  homeworkId: string;
  studentId: string;
}

function buildHomeworkSubmissionEmail(payload: HomeworkSubmissionEmailPayload) {
  const reviewUrl = `${getSiteOrigin()}/admin/homework/${payload.homeworkId}`;
  const dueLine = payload.dueDate ? `Due date: ${payload.dueDate}\n` : "";

  const text = [
    `${payload.studentName} submitted homework.`,
    "",
    `Assignment: ${payload.homeworkTitle}`,
    dueLine.trim(),
    "",
    "Submission:",
    payload.submissionText,
    "",
    `Review submission: ${reviewUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const dueHtml = payload.dueDate
    ? `<p><strong>Due date:</strong> ${payload.dueDate}</p>`
    : "";

  const html = `
    <p><strong>${escapeHtml(payload.studentName)}</strong> submitted homework.</p>
    <p><strong>Assignment:</strong> ${escapeHtml(payload.homeworkTitle)}</p>
    ${dueHtml}
    <p><strong>Submission:</strong></p>
    <pre style="white-space:pre-wrap;font-family:inherit;background:#f8fafc;padding:12px;border-radius:8px;">${escapeHtml(
      payload.submissionText
    )}</pre>
    <p><a href="${reviewUrl}">Review submission in TutorCheck</a></p>
  `.trim();

  return {
    subject: `Homework submitted: ${payload.homeworkTitle}`,
    text,
    html,
  };
}

export interface HomeworkCommentEmailPayload {
  authorRole: "student" | "parent";
  authorName: string;
  studentName: string;
  homeworkTitle: string;
  commentText: string;
  homeworkId: string;
}

function buildHomeworkCommentEmail(payload: HomeworkCommentEmailPayload) {
  const reviewUrl = `${getSiteOrigin()}/admin/homework/${payload.homeworkId}`;
  const roleLabel = payload.authorRole === "student" ? "Student" : "Parent";

  const text = [
    `${payload.authorName} (${roleLabel}) commented on homework for ${payload.studentName}.`,
    "",
    `Assignment: ${payload.homeworkTitle}`,
    "",
    "Comment:",
    payload.commentText,
    "",
    `View thread: ${reviewUrl}`,
  ].join("\n");

  const html = `
    <p><strong>${escapeHtml(payload.authorName)}</strong> (${roleLabel}) commented on homework for <strong>${escapeHtml(payload.studentName)}</strong>.</p>
    <p><strong>Assignment:</strong> ${escapeHtml(payload.homeworkTitle)}</p>
    <p><strong>Comment:</strong></p>
    <pre style="white-space:pre-wrap;font-family:inherit;background:#f8fafc;padding:12px;border-radius:8px;">${escapeHtml(
      payload.commentText
    )}</pre>
    <p><a href="${reviewUrl}">View homework thread in TutorCheck</a></p>
  `.trim();

  return {
    subject: `Homework comment from ${roleLabel.toLowerCase()}: ${payload.homeworkTitle}`,
    text,
    html,
  };
}

export async function notifyAdminHomeworkSubmission(
  payload: HomeworkSubmissionEmailPayload
): Promise<void> {
  const adminEmail = process.env.ADMIN_UPDATE_EMAIL?.trim();
  if (!adminEmail) {
    console.warn("Homework submission email skipped: ADMIN_UPDATE_EMAIL not configured");
    return;
  }

  await sendEmail(
    [adminEmail],
    buildHomeworkSubmissionEmail(payload),
    "Homework submission email skipped"
  );
}

export async function notifyAdminHomeworkComment(
  payload: HomeworkCommentEmailPayload
): Promise<void> {
  const adminEmail = process.env.ADMIN_UPDATE_EMAIL?.trim();
  if (!adminEmail) {
    console.warn("Homework comment email skipped: ADMIN_UPDATE_EMAIL not configured");
    return;
  }

  await sendEmail(
    [adminEmail],
    buildHomeworkCommentEmail(payload),
    "Homework comment email skipped"
  );
}

export interface MessageEmailPayload {
  authorRole: "student" | "parent";
  authorName: string;
  studentName: string;
  messageBody: string;
  studentId: string;
}

function buildMessageEmail(payload: MessageEmailPayload) {
  const threadUrl = `${getSiteOrigin()}/admin/messages/${payload.studentId}`;
  const roleLabel = payload.authorRole === "student" ? "Student" : "Parent";

  const text = [
    `${payload.authorName} (${roleLabel}) sent a message about ${payload.studentName}.`,
    "",
    "Message:",
    payload.messageBody,
    "",
    `View conversation: ${threadUrl}`,
  ].join("\n");

  const html = `
    <p><strong>${escapeHtml(payload.authorName)}</strong> (${roleLabel}) sent a message about <strong>${escapeHtml(payload.studentName)}</strong>.</p>
    <p><strong>Message:</strong></p>
    <pre style="white-space:pre-wrap;font-family:inherit;background:#f8fafc;padding:12px;border-radius:8px;">${escapeHtml(
      payload.messageBody
    )}</pre>
    <p><a href="${threadUrl}">View conversation in TutorCheck</a></p>
  `.trim();

  return {
    subject: `New message from ${roleLabel.toLowerCase()}: ${payload.studentName}`,
    text,
    html,
  };
}

export async function notifyAdminMessage(
  payload: MessageEmailPayload
): Promise<void> {
  const adminEmail = process.env.ADMIN_UPDATE_EMAIL?.trim();
  if (!adminEmail) {
    console.warn("Message email skipped: ADMIN_UPDATE_EMAIL not configured");
    return;
  }

  await sendEmail(
    [adminEmail],
    buildMessageEmail(payload),
    "Message email skipped"
  );
}
