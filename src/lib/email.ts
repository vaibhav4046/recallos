/**
 * Email sender. Dormant until RESEND_API_KEY is set, so shipping it is inert.
 * Uses Resend's REST API directly (no SDK dependency). Set:
 *   RESEND_API_KEY        — from https://resend.com (you create this; gated)
 *   NOTIFY_EMAIL_FROM     — verified sender, e.g. "Musemint <digest@yourdomain>"
 *   NOTIFY_EMAIL_TO       — where the daily digest lands
 */

export function isEmailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL_TO);
}

export interface EmailInput {
  subject: string;
  html: string;
  text: string;
  to?: string;
}

/** Returns true if accepted by the provider, false when disabled or on error. */
export async function sendEmail(input: EmailInput): Promise<boolean> {
  if (!isEmailEnabled()) return false;
  const to = input.to || process.env.NOTIFY_EMAIL_TO!;
  const from = process.env.NOTIFY_EMAIL_FROM || "Musemint <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject: input.subject, html: input.html, text: input.text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
