"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { Ad } from "@/models/Ad";
import { getStoreFromSession } from "@/lib/store/auth";
import type { AdActionState } from "@/types/ad";

export async function submitAdAction(
  _prevState: AdActionState,
  formData: FormData,
): Promise<AdActionState> {
  const store = await getStoreFromSession();
  if (!store) return { error: "Not authenticated." };

  const title = String(formData.get("title") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  const image = String(formData.get("image") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim();

  if (!title) return { error: "Title is required." };
  if (!text) return { error: "Ad text is required." };

  try {
    await connectDB();
    await Ad.create({
      storeId: store._id,
      title,
      text,
      ...(image ? { image } : {}),
      ...(link ? { link } : {}),
      status: "pending",
    });
  } catch (error) {
    console.error("[submitAdAction]", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Could not submit ad: ${message}` };
  }

  revalidatePath("/store/dashboard/ads");
  return { success: true };
}

export async function updateAdAction(
  _prevState: AdActionState,
  formData: FormData,
): Promise<AdActionState> {
  const store = await getStoreFromSession();
  if (!store) return { error: "Not authenticated." };

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
      { _id: adId, storeId: store._id },
      update,
      { new: true },
    );
    if (!result) return { error: "Ad not found." };
  } catch (error) {
    console.error("[updateAdAction]", error);
    return { error: "Could not update ad. Try again." };
  }

  revalidatePath("/store/dashboard/ads");
  return { success: true };
}

export async function deleteAdAction(adId: string): Promise<AdActionState> {
  const store = await getStoreFromSession();
  if (!store) return { error: "Not authenticated." };

  try {
    await connectDB();
    await Ad.deleteOne({ _id: adId, storeId: store._id });
  } catch {
    return { error: "Could not delete ad." };
  }

  revalidatePath("/store/dashboard/ads");
  return { success: true };
}
