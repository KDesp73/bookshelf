"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { requireUserWithUsername } from "@/lib/auth/require-user";
import { getShelfAppearance } from "@/lib/shelf/appearance";
import { parseShelfCssFile } from "@/lib/shelf/css";
import {
  isValidShelfColor,
  normalizeShelfAppearance,
} from "@/lib/shelf/presets";
import { SHELF_PRESETS, type ShelfAppearance } from "@/types/shelf";

export type ShelfActionState = {
  error?: string;
  success?: boolean;
};

export async function updateShelfAppearanceAction(
  _prevState: ShelfActionState,
  formData: FormData,
): Promise<ShelfActionState> {
  const auth = await requireUserWithUsername();
  if (auth.error || !auth.user) {
    return { error: auth.error ?? "Sign in required." };
  }

  const presetRaw = String(formData.get("shelfPreset") ?? "default");
  const accentColor = String(formData.get("shelfAccent") ?? "").trim();
  const backgroundColor = String(formData.get("shelfBackground") ?? "").trim();
  const customCssInput = String(formData.get("shelfCustomCss") ?? "").trim();
  const cssFile = formData.get("shelfCssFile");

  if (!SHELF_PRESETS.includes(presetRaw as ShelfAppearance["preset"])) {
    return { error: "Invalid shelf preset." };
  }

  if (!isValidShelfColor(accentColor) || !isValidShelfColor(backgroundColor)) {
    return { error: "Use valid hex colors like #92400e." };
  }

  let customCss = customCssInput;
  if (cssFile instanceof File && cssFile.size > 0) {
    try {
      customCss = parseShelfCssFile(await cssFile.text());
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Could not import CSS file.",
      };
    }
  } else if (customCss) {
    try {
      customCss = parseShelfCssFile(customCss);
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Invalid custom CSS.",
      };
    }
  }

  const appearance = normalizeShelfAppearance({
    preset: presetRaw as ShelfAppearance["preset"],
    accentColor: accentColor || undefined,
    backgroundColor: backgroundColor || undefined,
    customCss: customCss || undefined,
  });

  try {
    await connectDB();
    await User.findByIdAndUpdate(auth.user.id, {
      shelfPreset: appearance.preset,
      shelfAccent: appearance.accentColor,
      shelfBackground: appearance.backgroundColor,
      shelfCustomCss: appearance.customCss,
    });
  } catch {
    return { error: "Could not save shelf appearance." };
  }

  revalidatePath("/");
  revalidatePath("/wishlist");
  revalidatePath(`/u/${auth.user.username}`);

  return { success: true };
}
