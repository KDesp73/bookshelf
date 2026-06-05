"use server";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  countPromotionalRecipients,
  listPromotionalRecipients,
} from "@/lib/admin/promotional-recipients";
import { sendPromotionalBroadcast } from "@/lib/email/send-promotional-broadcast";
import type { ActionResult } from "@/actions/books";

export interface PromotionalBroadcastInput {
  subject: string;
  bodyMarkdown: string;
}

export interface PromotionalBroadcastSummary {
  sent: number;
  failed: number;
  errors: string[];
  recipientCount: number;
}

export async function sendPromotionalBroadcastAction(
  input: PromotionalBroadcastInput,
): Promise<ActionResult<PromotionalBroadcastSummary>> {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  const subject = input.subject?.trim();
  const bodyMarkdown = input.bodyMarkdown?.trim();

  if (!subject) {
    return { success: false, error: "Subject is required." };
  }
  if (subject.length > 200) {
    return { success: false, error: "Subject must be 200 characters or fewer." };
  }
  if (!bodyMarkdown) {
    return { success: false, error: "Message body is required." };
  }
  if (bodyMarkdown.length > 50_000) {
    return { success: false, error: "Message is too long." };
  }

  const recipients = await listPromotionalRecipients();
  const recipientCount = recipients.length;

  if (recipientCount === 0) {
    return {
      success: false,
      error: "No users have opted in to promotional emails.",
    };
  }

  const result = await sendPromotionalBroadcast(recipients, subject, bodyMarkdown);
  if (!result.ok) {
    return { success: false, error: result.error };
  }

  const { sent, failed, errors } = result.result;

  if (sent === 0) {
    return {
      success: false,
      error: errors[0] ?? "Could not send promotional email.",
    };
  }

  return {
    success: true,
    data: {
      sent,
      failed,
      errors,
      recipientCount,
    },
  };
}

export async function getPromotionalRecipientCountAction(): Promise<number> {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) {
    return 0;
  }

  return countPromotionalRecipients();
}
