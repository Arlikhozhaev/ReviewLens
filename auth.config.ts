import type { NextAuthConfig } from "next-auth";
import type { Provider } from "next-auth/providers";
import { env, getAuthSecret, getEmailFrom } from "@/lib/env";

async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.log(
      `\n[ReviewLens] Magic link for ${email} (set RESEND_API_KEY to send email):\n${url}\n`
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to: email,
      subject: "Sign in to ReviewLens",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #111;">Sign in to ReviewLens</h2>
          <p style="color: #555; line-height: 1.5;">
            Click the button below to sign in. This link expires in 24 hours.
          </p>
          <a href="${url}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            Sign in
          </a>
          <p style="color: #999; font-size: 12px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to send magic link (${response.status}): ${body}`);
  }
}

const emailProvider: Provider = {
  id: "email",
  name: "Email",
  type: "email",
  from: getEmailFrom(),
  maxAge: 24 * 60 * 60,
  async sendVerificationRequest({ identifier: email, url }) {
    await sendMagicLinkEmail(email, url);
  },
};

export default {
  providers: [emailProvider],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
  },
  secret: getAuthSecret(),
  trustHost: true,
} satisfies NextAuthConfig;
