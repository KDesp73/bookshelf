import "server-only";

import { Resend } from "resend";

const RESEND_TEST_FROM = "onboarding@resend.dev";

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export function getFromAddress(): string | null {
  const from = process.env.EMAIL_FROM?.trim();
  return from || null;
}

export function parseFromEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return (match?.[1] ?? from).trim().toLowerCase();
}

export function isResendTestFromAddress(from: string): boolean {
  return parseFromEmail(from) === RESEND_TEST_FROM;
}

export function isEmailConfigured(): boolean {
  return Boolean(getResendClient() && getFromAddress());
}

export function getEmailConfigError(): string | null {
  const from = getFromAddress();
  if (!getResendClient()) return "Set RESEND_API_KEY.";
  if (!from) return "Set EMAIL_FROM.";

  if (isResendTestFromAddress(from)) {
    return (
      `EMAIL_FROM is still "${RESEND_TEST_FROM}" (Resend test mode). ` +
      "Update EMAIL_FROM to an address on your verified domain."
    );
  }

  return null;
}

export function resendErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message.trim();
  }
  return "Could not send email.";
}
