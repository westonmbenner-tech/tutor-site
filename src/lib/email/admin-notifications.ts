const RESEND_API_URL = "https://api.resend.com/emails";

interface AdminEmailContent {
  subject: string;
  text: string;
  html: string;
}

function getSiteOrigin(): string {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.tutor-check.com";

  // Production canonical host is www; normalize bare domain for email links.
  if (/^https?:\/\/tutor-check\.com$/i.test(origin)) {
    return "https://www.tutor-check.com";
  }

  return origin;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getEmailConfig():
  | { adminEmail: string; apiKey: string; fromEmail: string }
  | { error: string } {
  const adminEmail = process.env.ADMIN_UPDATE_EMAIL?.trim();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.EMAIL_FROM?.trim();

  if (!adminEmail) {
    return { error: "ADMIN_UPDATE_EMAIL not configured" };
  }

  if (!apiKey) {
    return { error: "RESEND_API_KEY not configured" };
  }

  if (!fromEmail) {
    return { error: "EMAIL_FROM not configured" };
  }

  return { adminEmail, apiKey, fromEmail };
}

async function sendAdminEmail(
  content: AdminEmailContent,
  logContext: string
): Promise<{ sent: boolean; error?: string }> {
  const config = getEmailConfig();
  if ("error" in config) {
    console.warn(`${logContext}: ${config.error}`);
    return { sent: false, error: config.error };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.fromEmail,
        to: [config.adminEmail],
        subject: content.subject,
        text: content.text,
        html: content.html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`${logContext}:`, body);
      return { sent: false, error: body };
    }

    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error";
    console.error(`${logContext}:`, message);
    return { sent: false, error: message };
  }
}

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
  await sendAdminEmail(
    buildHomeworkSubmissionEmail(payload),
    "Homework submission email skipped"
  );
}

export async function notifyAdminHomeworkComment(
  payload: HomeworkCommentEmailPayload
): Promise<void> {
  await sendAdminEmail(
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
  await sendAdminEmail(buildMessageEmail(payload), "Message email skipped");
}
