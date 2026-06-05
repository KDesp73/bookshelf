import "server-only";

import { Resend } from "resend";

const APP_NAME = "BookShelf";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getFromAddress(): string | null {
  const from = process.env.EMAIL_FROM?.trim();
  return from || null;
}

export function isEmailConfigured(): boolean {
  return Boolean(getResendClient() && getFromAddress());
}

export async function sendLoginCodeEmail(
  to: string,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResendClient();
  const from = getFromAddress();

  if (!resend || !from) {
    return {
      ok: false,
      error: "Email is not configured. Set RESEND_API_KEY and EMAIL_FROM.",
    };
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject: `${code} is your ${APP_NAME} sign-in code`,
      text: [
        `Your ${APP_NAME} sign-in code is ${code}.`,
        "",
        "It expires in 10 minutes.",
        "",
        "If you did not try to sign in, you can ignore this email.",
      ].join("\n"),
      html: `
        <p>Your <strong>${APP_NAME}</strong> sign-in code is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 0.2em; margin: 16px 0;">${code}</p>
        <p style="color: #57534e;">It expires in 10 minutes.</p>
        <p style="color: #78716c; font-size: 14px;">If you did not try to sign in, you can ignore this email.</p>
      `.trim(),
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return { ok: false, error: "Could not send verification email." };
    }

    return { ok: true };
  } catch (error) {
    console.error("[email] send failed:", error);
    return { ok: false, error: "Could not send verification email." };
  }
}
