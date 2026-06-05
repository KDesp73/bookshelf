import "server-only";

import { getSiteUrl } from "@/lib/site-url";
import { markdownToHtml, markdownToPlainText } from "@/lib/email/markdown-to-html";
import {
  getEmailConfigError,
  getFromAddress,
  getResendClient,
  resendErrorMessage,
} from "@/lib/email/resend-client";
import type { PromotionalRecipient } from "@/lib/admin/promotional-recipients";

const APP_NAME = "BookShelf";
const BATCH_SIZE = 100;

function wrapPromotionalHtml(contentHtml: string): string {
  const settingsUrl = `${getSiteUrl()}/settings`;

  return `
<div style="margin: 0; padding: 0; background: #f6f1ea; font-family: Georgia, 'Times New Roman', serif; color: #292524;">
  <div style="max-width: 560px; margin: 0 auto; padding: 32px 20px;">
    <p style="margin: 0 0 24px; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; color: #92400e;">
      ${APP_NAME}
    </p>
    <div style="background: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; padding: 28px 24px; color: #44403c; line-height: 1.6; font-size: 16px;">
      ${contentHtml}
    </div>
    <p style="margin: 24px 0 0; font-size: 12px; line-height: 1.5; color: #78716c;">
      You received this because you opted in to ${APP_NAME} updates.
      <a href="${settingsUrl}" style="color: #92400e;">Manage email preferences</a>
    </p>
  </div>
</div>
  `.trim();
}

function wrapPromotionalText(contentText: string): string {
  const settingsUrl = `${getSiteUrl()}/settings`;
  return [
    contentText,
    "",
    "---",
    `You received this because you opted in to ${APP_NAME} updates.`,
    `Manage email preferences: ${settingsUrl}`,
  ].join("\n");
}

export interface PromotionalBroadcastResult {
  sent: number;
  failed: number;
  errors: string[];
}

export async function sendPromotionalBroadcast(
  recipients: PromotionalRecipient[],
  subject: string,
  bodyMarkdown: string,
): Promise<
  { ok: true; result: PromotionalBroadcastResult } | { ok: false; error: string }
> {
  const configError = getEmailConfigError();
  if (configError) {
    return { ok: false, error: configError };
  }

  const resend = getResendClient();
  const from = getFromAddress();
  if (!resend || !from) {
    return { ok: false, error: "Email is not configured." };
  }

  if (recipients.length === 0) {
    return { ok: false, error: "No recipients have opted in to promotional emails." };
  }

  const contentHtml = await markdownToHtml(bodyMarkdown);
  const html = wrapPromotionalHtml(contentHtml);
  const text = wrapPromotionalText(markdownToPlainText(bodyMarkdown));

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let index = 0; index < recipients.length; index += BATCH_SIZE) {
    const batch = recipients.slice(index, index + BATCH_SIZE);
    const payload = batch.map((recipient) => ({
      from,
      to: recipient.email,
      subject,
      html,
      text,
    }));

    try {
      const { data, error } = await resend.batch.send(payload);

      if (error) {
        failed += batch.length;
        errors.push(resendErrorMessage(error));
        continue;
      }

      const batchSent = Array.isArray(data?.data) ? data.data.length : batch.length;
      sent += batchSent;
    } catch (error) {
      failed += batch.length;
      errors.push(resendErrorMessage(error));
    }
  }

  return {
    ok: true,
    result: {
      sent,
      failed,
      errors: errors.slice(0, 5),
    },
  };
}
