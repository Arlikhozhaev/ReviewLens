import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import authConfig from "@/auth.config";
import { env, getEmailFrom } from "@/lib/env";
import { sendResendEmail } from "@/lib/email/resend";

async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.log(
      `\n[ReviewLens] Magic link for ${email} (set RESEND_API_KEY to send email):\n${url}\n`
    );
    return;
  }

  const result = await sendResendEmail({
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
  });

  if (result.emailSent) return;

  if (env.NODE_ENV === "development") {
    console.log(
      `\n[ReviewLens] Magic link for ${email} (email not sent — use this link):\n${url}\nFrom: ${getEmailFrom()}\nReason: ${result.emailError ?? "unknown"}\n`
    );
    return;
  }

  throw new Error(result.emailError ?? "Failed to send sign-in email");
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [emailProvider],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
});
