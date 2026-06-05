"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { requireUserWithUsername } from "@/lib/auth/require-user";
import { User } from "@/models/User";
import type { ActionResult } from "@/actions/books";

export async function updatePromotionalEmailsAction(
  optIn: boolean,
): Promise<ActionResult<{ promotionalEmailsOptIn: boolean }>> {
  const auth = await requireUserWithUsername();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Sign in required." };
  }

  try {
    await connectDB();
    await User.findByIdAndUpdate(auth.user.id, {
      promotionalEmailsOptIn: optIn === true,
    });

    revalidatePath("/settings");
    return { success: true, data: { promotionalEmailsOptIn: optIn === true } };
  } catch {
    return { success: false, error: "Could not update email preferences." };
  }
}
