"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { requireUserWithUsername } from "@/lib/auth/require-user";
import { getCurrentChallengeYear } from "@/lib/challenges/queries";
import { ReadingChallenge } from "@/models/ReadingChallenge";
import type { ActionResult } from "@/actions/books";

export interface ReadingChallengeResult {
  year: number;
  target: number | null;
}

export async function setReadingChallengeAction(
  target: number | null,
): Promise<ActionResult<ReadingChallengeResult>> {
  const auth = await requireUserWithUsername();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Sign in required." };
  }

  if (target !== null) {
    if (!Number.isInteger(target) || target < 1 || target > 9999) {
      return {
        success: false,
        error: "Enter a whole number between 1 and 9999.",
      };
    }
  }

  const year = getCurrentChallengeYear();

  try {
    await connectDB();

    if (target === null) {
      await ReadingChallenge.deleteOne({ userId: auth.user.id, year });
    } else {
      await ReadingChallenge.findOneAndUpdate(
        { userId: auth.user.id, year },
        { $set: { target } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    revalidatePath("/");
    revalidatePath(`/u/${auth.user.username}`);

    return { success: true, data: { year, target } };
  } catch {
    return { success: false, error: "Could not update your reading goal." };
  }
}
