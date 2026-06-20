const RESEND_API_URL = "https://api.resend.com/emails";

export interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

export function getSiteOrigin(): string {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.tutor-check.com";

  if (/^https?:\/\/tutor-check\.com$/i.test(origin)) {
    return "https://www.tutor-check.com";
  }

  return origin;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getResendConfig():
  | { apiKey: string; fromEmail: string; replyToEmail?: string }
  | { error: string } {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.EMAIL_FROM?.trim();
  const replyToEmail = process.env.ADMIN_UPDATE_EMAIL?.trim();

  if (!apiKey) {
    return { error: "RESEND_API_KEY not configured" };
  }

  if (!fromEmail) {
    return { error: "EMAIL_FROM not configured" };
  }

  return { apiKey, fromEmail, replyToEmail };
}

export async function sendEmail(
  to: string[],
  content: EmailContent,
  logContext: string,
  options?: { replyTo?: string }
): Promise<{ sent: boolean; error?: string }> {
  const recipients = to.map((address) => address.trim()).filter(Boolean);
  if (recipients.length === 0) {
    console.warn(`${logContext}: no recipient email configured`);
    return { sent: false, error: "No recipient email" };
  }

  const config = getResendConfig();
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
        to: recipients,
        reply_to: options?.replyTo ?? config.replyToEmail,
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
