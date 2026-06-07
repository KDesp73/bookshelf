"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { signOut } from "@/auth";
import { connectDB } from "@/lib/db";
import { requireUser, requireUserWithUsername } from "@/lib/auth/require-user";
import { deleteUserAndData } from "@/lib/admin/queries";
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

export async function deleteAccountAction(
  _prev: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Sign in required." };
  }

  const confirmationEmail = String(formData.get("confirmation") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (confirmationEmail !== auth.user.email) {
    return { success: false, error: "Type your email address to confirm deletion." };
  }

  await connectDB();

  const user = await User.findById(auth.user.id).select("+passwordHash");
  if (user?.passwordHash && !password) {
    return { success: false, error: "Enter your password to delete your account." };
  }

  if (user?.passwordHash) {
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return { success: false, error: "Password is incorrect." };
    }
  }

  const deleted = await deleteUserAndData(auth.user.id);
  if (!deleted) {
    return { success: false, error: "Could not delete account. Try again." };
  }

  await signOut({ redirectTo: "/" });
  return { success: true, data: null };
}
