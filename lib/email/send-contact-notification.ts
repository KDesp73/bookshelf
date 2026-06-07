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

function getAdminEmail(): string | null {
  const email = process.env.ADMIN_EMAIL?.trim();
  return email || null;
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

export async function sendContactNotification(
  name: string,
  email: string,
  message: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResendClient();
  const from = getFromAddress();
  const to = getAdminEmail();

  if (!resend || !from) {
    return {
      ok: false,
      error: "Email is not configured. Set RESEND_API_KEY and EMAIL_FROM.",
    };
  }

  if (!to) {
    return {
      ok: false,
      error: "Admin email not configured. Set ADMIN_EMAIL.",
    };
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `[${APP_NAME} Contact] ${name}`,
      text: [
        `New contact form submission:`,
        ``,
        `Name:    ${name}`,
        `Email:   ${email}`,
        ``,
        `Message:`,
        message,
        ``,
        `---`,
        `Sent via ${APP_NAME} contact form`,
      ].join("\n"),
      html: `
        <table style="width:100%;font-family:Georgia,serif;background:#f6f1ea;padding:32px;">
          <tr>
            <td align="center">
              <table style="max-width:520px;width:100%;background:#fff;border-radius:12px;padding:32px;">
                <tr>
                  <td style="font-size:20px;font-weight:700;color:#1c1917;padding-bottom:16px;">
                    ${APP_NAME}
                  </td>
                </tr>
                <tr>
                  <td style="font-size:18px;font-weight:600;color:#1c1917;padding-bottom:8px;">
                    New contact form submission
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 0;border-top:1px solid #e7e5e4;">
                    <table style="width:100%;font-size:14px;color:#44403c;">
                      <tr>
                        <td style="font-weight:600;color:#292524;padding:4px 8px 4px 0;white-space:nowrap;vertical-align:top;">Name</td>
                        <td style="padding:4px 0;">${name}</td>
                      </tr>
                      <tr>
                        <td style="font-weight:600;color:#292524;padding:4px 8px 4px 0;white-space:nowrap;vertical-align:top;">Email</td>
                        <td style="padding:4px 0;"><a href="mailto:${email}" style="color:#b45309;">${email}</a></td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#44403c;padding:8px 0 4px;font-weight:600;">Message</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#44403c;padding:4px 0 16px;line-height:1.6;white-space:pre-wrap;">${message}</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#a8a29e;padding-top:16px;border-top:1px solid #e7e5e4;">
                    Sent via ${APP_NAME} contact form
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
