"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { requireUserWithUsername } from "@/lib/auth/require-user";
import type { ActionResult } from "@/actions/books";

export async function updateWishlistVisibilityAction(
  isPublic: boolean,
): Promise<ActionResult<{ wishlistPublic: boolean }>> {
  const auth = await requireUserWithUsername();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Sign in required." };
  }

  try {
    await connectDB();
    await User.findByIdAndUpdate(auth.user.id, {
      wishlistPublic: isPublic,
    });
  } catch {
    return { success: false, error: "Could not update wishlist visibility." };
  }

  revalidatePath("/wishlist");
  revalidatePath("/settings");
  revalidatePath(`/u/${auth.user.username}`);
  revalidatePath(`/u/${auth.user.username}/wishlist`);

  return { success: true, data: { wishlistPublic: isPublic } };
}
