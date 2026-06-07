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

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "http://localhost:3000";
}

function resendErrorMessage(error: unknown): string {
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

export async function sendPasswordResetEmail(
  to: string,
  token: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResendClient();
  const from = getFromAddress();

  if (!resend || !from) {
    return {
      ok: false,
      error: "Email is not configured. Set RESEND_API_KEY and EMAIL_FROM.",
    };
  }

  const resetLink = `${getAppUrl()}/reset-password?token=${token}`;

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject: `Reset your ${APP_NAME} password`,
      text: [
        `We received a request to reset your ${APP_NAME} password.`,
        ``,
        `Click the link below to set a new password. This link expires in 30 minutes.`,
        ``,
        resetLink,
        ``,
        `If you did not request a password reset, you can ignore this email.`,
      ].join("\n"),
      html: `
        <table style="width:100%;font-family:Georgia,serif;background:#f6f1ea;padding:32px;">
          <tr>
            <td align="center">
              <table style="max-width:480px;width:100%;background:#fff;border-radius:12px;padding:32px;">
                <tr>
                  <td style="font-size:20px;font-weight:700;color:#1c1917;padding-bottom:8px;">
                    ${APP_NAME}
                  </td>
                </tr>
                <tr>
                  <td style="font-size:16px;font-weight:600;color:#1c1917;padding-bottom:16px;">
                    Reset your password
                  </td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#44403c;padding-bottom:20px;line-height:1.6;">
                    We received a request to reset your ${APP_NAME} password.
                    Click the button below to set a new one. This link expires in 30 minutes.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <a href="${resetLink}"
                       style="display:inline-block;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;color:#fff;background:#b45309;text-decoration:none;">
                      Reset password
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#44403c;padding-bottom:20px;line-height:1.6;">
                    Or copy and paste this link into your browser:
                  </td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#78716c;padding:12px;background:#f5f5f4;border-radius:6px;word-break:break-all;">
                    ${resetLink}
                  </td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#a8a29e;padding-top:20px;border-top:1px solid #e7e5e4;">
                    If you did not request a password reset, you can ignore this email.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `.trim(),
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return { ok: false, error: resendErrorMessage(error) };
    }

    return { ok: true };
  } catch (error) {
    console.error("[email] send failed:", error);
    return { ok: false, error: resendErrorMessage(error) };
  }
}
