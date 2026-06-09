"use server";

import { requireUser } from "@/lib/auth/require-user";
import { awardEasterEgg, isEasterEggId, EASTER_EGGS } from "@/lib/easter-eggs";
import type { ActionResult } from "@/actions/books";

export async function awardEasterEggAction(
  eggId: string,
): Promise<ActionResult<{ name: string; description: string } | null>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Sign in required." };
  }

  if (!isEasterEggId(eggId)) {
    return { success: false, error: "Invalid easter egg." };
  }

  try {
    const newlyEarned = await awardEasterEgg(auth.user.id, eggId);
    if (newlyEarned) {
      return {
        success: true,
        data: {
          name: EASTER_EGGS[eggId].name,
          description: EASTER_EGGS[eggId].description,
        },
      };
    }
    return { success: true, data: null };
  } catch {
    return { success: false, error: "Failed to award easter egg." };
  }
}
