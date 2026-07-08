"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { Ad } from "@/models/Ad";
import { getSessionUser } from "@/lib/auth/get-session-user";
import type { AdActionState } from "@/types/ad";

export async function submitAdAction(
  _prevState: AdActionState,
  formData: FormData,
): Promise<AdActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "Sign in required." };
  if (!user.isStore) return { error: "Only store accounts can submit ads." };

  const title = String(formData.get("title") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  const image = String(formData.get("image") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim();

  if (!title) return { error: "Title is required." };
  if (!text) return { error: "Ad text is required." };

  try {
    await connectDB();

    const existingCount = await Ad.countDocuments({ userId: user.id });
    if (existingCount >= 3) {
      return { error: "Maximum of 3 ads per store. Delete an existing ad first." };
    }

    await Ad.create({
      userId: user.id,
      title,
      text,
      ...(image ? { image } : {}),
      ...(link ? { link } : {}),
      status: "pending",
    });
  } catch {
    return { error: "Could not submit ad. Try again." };
  }

  revalidatePath("/store/dashboard/ads");
  return { success: true };
}

export async function updateAdAction(
  _prevState: AdActionState,
  formData: FormData,
): Promise<AdActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "Sign in required." };
  if (!user.isStore) return { error: "Only store accounts can manage ads." };

  const adId = String(formData.get("adId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  const image = String(formData.get("image") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim();

  if (!adId) return { error: "Ad ID is required." };
  if (!title) return { error: "Title is required." };
  if (!text) return { error: "Ad text is required." };

  try {
    await connectDB();
    const update: Record<string, unknown> = {
      title,
      text,
      ...(link ? { link } : {}),
    };
    if (image) {
      update.image = image;
    } else {
      update.$unset = { image: "" };
    }
    const result = await Ad.findOneAndUpdate(
      { _id: adId, userId: user.id },
      update,
      { new: true },
    );
    if (!result) return { error: "Ad not found." };
  } catch {
    return { error: "Could not update ad. Try again." };
  }

  revalidatePath("/store/dashboard/ads");
  return { success: true };
}

export async function deleteAdAction(adId: string): Promise<AdActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "Sign in required." };
  if (!user.isStore) return { error: "Only store accounts can manage ads." };

  try {
    await connectDB();
    await Ad.deleteOne({ _id: adId, userId: user.id });
  } catch {
    return { error: "Could not delete ad." };
  }

  revalidatePath("/store/dashboard/ads");
  return { success: true };
}
