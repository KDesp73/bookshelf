import "server-only";

import { getSiteUrl } from "@/lib/site-url";
import { sendPromotionalBroadcast } from "@/lib/email/send-promotional-broadcast";
import { listPromotionalRecipients } from "@/lib/admin/promotional-recipients";
import type { BlogPostDocument } from "@/types/blog";

export interface SendPostPromotionalResult {
  sent: number;
  failed: number;
  errors: string[];
}

export async function sendPostPromotional(
  post: BlogPostDocument,
): Promise<
  { ok: true; result: SendPostPromotionalResult } | { ok: false; error: string }
> {
  const recipients = await listPromotionalRecipients();
  if (recipients.length === 0) {
    return { ok: false, error: "No recipients have opted in to promotional emails." };
  }

  const postUrl = `${getSiteUrl()}/news/${post.slug}`;
  const subject = `New: ${post.title}`;

  const excerpt = post.excerpt
    ? post.excerpt
    : post.body.replace(/^#+\s+.*\n?/m, "").substring(0, 300).replace(/\n\n[\s\S]*/, "") + "…";

  const bodyMarkdown = [
    `## ${post.title}`,
    "",
    excerpt,
    "",
    `[Read more on BookShelf](${postUrl})`,
  ].join("\n");

  return sendPromotionalBroadcast(recipients, subject, bodyMarkdown);
}
