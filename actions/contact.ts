"use server";

import type { ActionResult } from "@/actions/books";
import { sendContactNotification } from "@/lib/email/send-contact-notification";

export async function submitContactForm(
  _prev: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const message = formData.get("message")?.toString().trim();

  if (!name || !email || !message) {
    return { success: false, error: "All fields are required." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  if (message.length < 10) {
    return { success: false, error: "Message must be at least 10 characters." };
  }

  const result = await sendContactNotification(name, email, message);

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  return { success: true, data: null };
}
