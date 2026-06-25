import { env, getEmailFrom } from "@/lib/env";

export function getAppUrl(): string {
  return env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
}

export interface SendTeamInviteEmailInput {
  to: string;
  inviteUrl: string;
  orgName: string;
  inviterName?: string | null;
}

export interface SendTeamInviteEmailResult {
  emailSent: boolean;
  /** When email wasn't sent (no Resend key), log this for dev. */
  devFallbackUrl?: string;
}

export async function sendTeamInviteEmail(
  input: SendTeamInviteEmailInput
): Promise<SendTeamInviteEmailResult> {
  const { to, inviteUrl, orgName, inviterName } = input;

  if (!env.RESEND_API_KEY) {
    console.log(
      `\n[ReviewLens] Team invite for ${to} (set RESEND_API_KEY to send email):\n${inviteUrl}\n`
    );
    return { emailSent: false, devFallbackUrl: inviteUrl };
  }

  const inviterLine = inviterName
    ? `<strong>${escapeHtml(inviterName)}</strong> invited you to join `
    : "You've been invited to join ";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to,
      subject: `Join ${orgName} on ReviewLens`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
          <h2 style="font-size: 20px; margin-bottom: 8px;">Join ${escapeHtml(orgName)}</h2>
          <p style="color: #555; line-height: 1.6; font-size: 15px;">
            ${inviterLine}<strong>${escapeHtml(orgName)}</strong> on ReviewLens — shared review analyses for your team.
          </p>
          <a href="${inviteUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; margin: 20px 0;">
            Accept invite
          </a>
          <p style="color: #888; font-size: 12px; line-height: 1.5;">
            This link expires in 7 days. Sign in with <strong>${escapeHtml(to)}</strong> to accept.
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to send invite email (${response.status}): ${body}`);
  }

  return { emailSent: true };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
