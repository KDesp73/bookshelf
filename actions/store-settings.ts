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
  const storePostalCode = String(formData.get("storePostalCode") ?? "").trim();
  const storeCity = String(formData.get("storeCity") ?? "").trim();
  const storeWebsite = String(formData.get("storeWebsite") ?? "").trim();
  const storeLatitudeRaw = formData.get("storeLatitude");
  const storeLongitudeRaw = formData.get("storeLongitude");
  const storeLatitude = storeLatitudeRaw ? Number(storeLatitudeRaw) : undefined;
  const storeLongitude = storeLongitudeRaw ? Number(storeLongitudeRaw) : undefined;

  if (!storeName) return { error: "Store name is required." };

  try {
    await connectDB();
    await User.findByIdAndUpdate(user.id, {
      isStore: true,
      storeName,
      storeDescription: storeDescription || undefined,
      storeAddress: storeAddress || undefined,
      storePhone: storePhone || undefined,
      storePostalCode: storePostalCode || undefined,
      storeCity: storeCity || undefined,
      storeWebsite: storeWebsite || undefined,
      storeLatitude,
      storeLongitude,
    });
  } catch {
    return { error: "Could not convert account. Try again." };
  }

  revalidatePath("/settings");
  revalidatePath("/store/dashboard");
  revalidatePath("/store/dashboard/settings");
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
  const storePostalCode = String(formData.get("storePostalCode") ?? "").trim();
  const storeCity = String(formData.get("storeCity") ?? "").trim();
  const storeWebsite = String(formData.get("storeWebsite") ?? "").trim();
  const storeImagesRaw = formData.getAll("storeImages");
  const storeImages = storeImagesRaw
    .map((v) => String(v).trim())
    .filter(Boolean);
  const storeLatitudeRaw = formData.get("storeLatitude");
  const storeLongitudeRaw = formData.get("storeLongitude");
  const storeLatitude = storeLatitudeRaw ? Number(storeLatitudeRaw) : undefined;
  const storeLongitude = storeLongitudeRaw ? Number(storeLongitudeRaw) : undefined;

  if (!storeName) return { error: "Store name is required." };

  try {
    await connectDB();
    await User.findByIdAndUpdate(user.id, {
      storeName,
      storeDescription: storeDescription || undefined,
      storeAddress: storeAddress || undefined,
      storePhone: storePhone || undefined,
      storePostalCode: storePostalCode || undefined,
      storeCity: storeCity || undefined,
      storeWebsite: storeWebsite || undefined,
      storeImages: storeImages.length > 0 ? storeImages : undefined,
      storeLatitude,
      storeLongitude,
    });
  } catch {
    return { error: "Could not update store info. Try again." };
  }

  revalidatePath("/settings");
  revalidatePath("/store/dashboard");
  revalidatePath("/store/dashboard/settings");
  return { success: true };
}

export async function revertToUserAction(): Promise<StoreSettingsState> {
  const user = await getSessionUser();
  if (!user) return { error: "Sign in required." };
  if (!user.isStore) return { error: "Not a store account." };

  try {
    await connectDB();
    await User.findByIdAndUpdate(user.id, {
      $set: { isStore: false },
      $unset: {
        storeName: "",
        storeDescription: "",
        storeAddress: "",
        storePhone: "",
        storeLogo: "",
        storePostalCode: "",
        storeCity: "",
        storeImages: "",
        storeWebsite: "",
        storeLatitude: "",
        storeLongitude: "",
      },
    });
  } catch {
    return { error: "Could not revert account. Try again." };
  }

  revalidatePath("/settings");
  revalidatePath("/store/dashboard");
  revalidatePath("/store/dashboard/settings");
  return { success: true };
}
