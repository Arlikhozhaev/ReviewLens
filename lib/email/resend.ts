import { env, getEmailFrom } from "@/lib/env";

const RESEND_SANDBOX_DOMAIN = "resend.dev";

const PUBLIC_SENDER_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
]);

export type EmailDeliverySkipReason =
  | "no_api_key"
  | "sandbox_recipient_limit"
  | "unverified_public_sender"
  | "provider_error";

export interface EmailDeliveryPreflight {
  canSend: boolean;
  reason?: EmailDeliverySkipReason;
  userMessage?: string;
}

export function parseFromAddress(from: string): {
  email: string;
  displayName?: string;
} {
  const match = from.match(/^(.+?)\s*<([^>]+)>$/);
  if (match?.[1] && match[2]) {
    return {
      displayName: match[1].trim(),
      email: match[2].trim().toLowerCase(),
    };
  }
  return { email: from.trim().toLowerCase() };
}

export function getSenderDomain(from: string): string {
  const { email } = parseFromAddress(from);
  return email.split("@")[1] ?? "";
}

export function isResendSandboxFrom(from: string): boolean {
  return getSenderDomain(from) === RESEND_SANDBOX_DOMAIN;
}

export function isPublicEmailSender(from: string): boolean {
  return PUBLIC_SENDER_DOMAINS.has(getSenderDomain(from));
}

export function getResendAccountEmail(): string | undefined {
  return env.RESEND_ACCOUNT_EMAIL?.trim().toLowerCase();
}

export function preflightEmailDelivery(to: string): EmailDeliveryPreflight {
  const toEmail = to.trim().toLowerCase();
  const from = getEmailFrom();

  if (!env.RESEND_API_KEY) {
    return {
      canSend: false,
      reason: "no_api_key",
      userMessage: "Email is not configured. Copy the link below and share it manually.",
    };
  }

  if (isPublicEmailSender(from)) {
    return {
      canSend: false,
      reason: "unverified_public_sender",
      userMessage:
        "Gmail and other public inboxes cannot be used as the sender. Verify your own domain at resend.com/domains, then set EMAIL_FROM to an address on that domain (for example ReviewLens <hello@yourdomain.com>).",
    };
  }

  if (isResendSandboxFrom(from)) {
    const accountEmail = getResendAccountEmail();
    if (!accountEmail) {
      return {
        canSend: false,
        reason: "sandbox_recipient_limit",
        userMessage:
          "onboarding@resend.dev only sends to your Resend account email. Set RESEND_ACCOUNT_EMAIL in .env.local, verify a domain at resend.com/domains, or copy the invite link manually.",
      };
    }
    if (toEmail !== accountEmail) {
      return {
        canSend: false,
        reason: "sandbox_recipient_limit",
        userMessage: `With onboarding@resend.dev, Resend only delivers to ${accountEmail}. To email ${toEmail}, verify a domain at resend.com/domains and set EMAIL_FROM to an address on that domain.`,
      };
    }
  }

  return { canSend: true };
}

export interface SendResendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface SendResendEmailResult {
  emailSent: boolean;
  emailError?: string;
  skipReason?: EmailDeliverySkipReason;
}

export async function sendResendEmail(
  input: SendResendEmailInput
): Promise<SendResendEmailResult> {
  const preflight = preflightEmailDelivery(input.to);
  if (!preflight.canSend) {
    return {
      emailSent: false,
      emailError: preflight.userMessage,
      skipReason: preflight.reason,
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getEmailFrom(),
        to: input.to,
        subject: input.subject,
        html: input.html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      const emailError = parseResendError(body, response.status);
      console.error(`[ReviewLens] Email failed for ${input.to}:`, emailError);
      return {
        emailSent: false,
        emailError,
        skipReason: "provider_error",
      };
    }

    return { emailSent: true };
  } catch (error) {
    const emailError =
      error instanceof Error ? error.message : "Could not reach email provider";
    console.error(`[ReviewLens] Email failed for ${input.to}:`, emailError);
    return { emailSent: false, emailError, skipReason: "provider_error" };
  }
}

export function parseResendError(body: string, status: number): string {
  let message = "";
  try {
    const json = JSON.parse(body) as { message?: string; error?: string };
    message = json.message ?? json.error ?? "";
  } catch {
    message = body.trim();
  }

  const normalized = message.toLowerCase();

  if (
    normalized.includes("only send testing emails") ||
    normalized.includes("verify a domain")
  ) {
    return "Resend sandbox mode: verify your own domain at resend.com/domains and set EMAIL_FROM to an address on that domain to email teammates.";
  }

  if (normalized.includes("domain is not verified")) {
    return "Your sender domain is not verified in Resend. Add and verify it at resend.com/domains, then update EMAIL_FROM.";
  }

  return message.slice(0, 240) || `Email provider error (${status})`;
}
