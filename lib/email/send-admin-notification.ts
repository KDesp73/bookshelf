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

export async function sendAdminPromotedEmail(
  to: string,
  grantedBy: string,
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
      subject: `You are now an admin on ${APP_NAME}`,
      text: [
        `You have been granted admin access to ${APP_NAME} by ${grantedBy}.`,
        ``,
        `"With great power comes great responsibility."`,
        ``,
        `You can now manage the platform from the admin dashboard.`,
        `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/admin`,
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
                    Admin access granted
                  </td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#44403c;padding-bottom:12px;line-height:1.6;">
                    You have been granted admin access to ${APP_NAME} by <strong>${grantedBy}</strong>.
                  </td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#92400e;padding:12px 16px;background:#fffbeb;border-radius:8px;margin-bottom:16px;font-style:italic;">
                    &ldquo;With great power comes great responsibility.&rdquo;
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:20px 0 0;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/admin"
                       style="display:inline-block;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;color:#fff;background:#b45309;text-decoration:none;">
                      Go to admin dashboard
                    </a>
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
