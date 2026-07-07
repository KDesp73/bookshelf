"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getSessionUser } from "@/lib/auth/get-session-user";

export type StoreSettingsState = {
  error?: string;
  success?: boolean;
};

export async function convertToStoreAction(
  _prevState: StoreSettingsState,
  formData: FormData,
): Promise<StoreSettingsState> {
  const user = await getSessionUser();
  if (!user) return { error: "Sign in required." };
  if (user.isStore) return { error: "Already a store account." };

  const storeName = String(formData.get("storeName") ?? "").trim();
  const storeDescription = String(formData.get("storeDescription") ?? "").trim();
  const storeAddress = String(formData.get("storeAddress") ?? "").trim();
  const storePhone = String(formData.get("storePhone") ?? "").trim();

  if (!storeName) return { error: "Store name is required." };

  try {
    await connectDB();
    await User.findByIdAndUpdate(user.id, {
      isStore: true,
      storeName,
      storeDescription: storeDescription || undefined,
      storeAddress: storeAddress || undefined,
      storePhone: storePhone || undefined,
    });
  } catch {
    return { error: "Could not convert account. Try again." };
  }

  revalidatePath("/settings");
  revalidatePath("/store/dashboard");
  return { success: true };
}

export async function updateStoreInfoAction(
  _prevState: StoreSettingsState,
  formData: FormData,
): Promise<StoreSettingsState> {
  const user = await getSessionUser();
  if (!user) return { error: "Sign in required." };
  if (!user.isStore) return { error: "Not a store account." };

  const storeName = String(formData.get("storeName") ?? "").trim();
  const storeDescription = String(formData.get("storeDescription") ?? "").trim();
  const storeAddress = String(formData.get("storeAddress") ?? "").trim();
  const storePhone = String(formData.get("storePhone") ?? "").trim();

  if (!storeName) return { error: "Store name is required." };

  try {
    await connectDB();
    await User.findByIdAndUpdate(user.id, {
      storeName,
      storeDescription: storeDescription || undefined,
      storeAddress: storeAddress || undefined,
      storePhone: storePhone || undefined,
    });
  } catch {
    return { error: "Could not update store info. Try again." };
  }

  revalidatePath("/settings");
  revalidatePath("/store/dashboard");
  return { success: true };
}
