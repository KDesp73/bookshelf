"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-admin";
import { ADMIN_PERMISSIONS } from "@/lib/constants";
import {
  getAllAchievements,
  getAchievementById,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  awardAllAchievements,
  syncAllAchievements,
} from "@/lib/achievements";
import { ACHIEVEMENT_CONDITION_TYPES, type AchievementConditionType } from "@/lib/constants";
import type { ActionResult } from "@/actions/books";
import type { AchievementWithProgress } from "@/lib/achievements";

export async function listAchievementsAction(): Promise<
  ActionResult<AchievementWithProgress[]>
> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_ACHIEVEMENTS);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    const achievements = await getAllAchievements();
    const mapped = achievements.map((a) => ({
      ...a,
      _id: a._id as { toString(): string },
      earned: false,
    })) as unknown as AchievementWithProgress[];
    return { success: true, data: mapped };
  } catch {
    return { success: false, error: "Failed to load achievements." };
  }
}

export async function getAchievementAction(
  id: string,
): Promise<ActionResult<AchievementWithProgress | null>> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_ACHIEVEMENTS);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    const achievement = await getAchievementById(id);
    if (!achievement) {
      return { success: false, error: "Achievement not found." };
    }
    return {
      success: true,
      data: {
        ...achievement,
        _id: achievement._id as { toString(): string },
        earned: false,
      } as unknown as AchievementWithProgress,
    };
  } catch {
    return { success: false, error: "Failed to load achievement." };
  }
}

export async function createAchievementAction(
  formData: FormData,
): Promise<ActionResult<null>> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_ACHIEVEMENTS);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const badgeFile = formData.get("badge") as File | null;
  const conditionType = formData.get("conditionType") as string;
  const conditionValue = formData.get("conditionValue") as string;

  if (!name?.trim()) {
    return { success: false, error: "Name is required." };
  }
  if (!description?.trim()) {
    return { success: false, error: "Description is required." };
  }
  if (!ACHIEVEMENT_CONDITION_TYPES.includes(conditionType as never)) {
    return { success: false, error: "Invalid condition type." };
  }
  const value = parseInt(conditionValue, 10);
  if (isNaN(value) || value < 1) {
    return { success: false, error: "Condition value must be a positive number." };
  }

  let badge: string | undefined;
  if (badgeFile && badgeFile.size > 0) {
    const MAX_BADGE_BYTES = 512 * 1024;
    if (badgeFile.size > MAX_BADGE_BYTES) {
      return { success: false, error: "Badge image must be under 512 KB." };
    }
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowedMimes.includes(badgeFile.type)) {
      return { success: false, error: "Badge must be JPEG, PNG, WebP, GIF, or SVG." };
    }
    const buffer = Buffer.from(await badgeFile.arrayBuffer());
    badge = `data:${badgeFile.type};base64,${buffer.toString("base64")}`;
  }

  try {
    await createAchievement({ name: name.trim(), description: description.trim(), badge, conditionType: conditionType as AchievementConditionType, conditionValue: value });
    revalidatePath("/admin/achievements");
    return { success: true, data: null };
  } catch {
    return { success: false, error: "Failed to create achievement." };
  }
}

export async function updateAchievementAction(
  id: string,
  formData: FormData,
): Promise<ActionResult<null>> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_ACHIEVEMENTS);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const badgeFile = formData.get("badge") as File | null;
  const removeBadge = formData.get("removeBadge") === "true";
  const conditionType = formData.get("conditionType") as string;
  const conditionValue = formData.get("conditionValue") as string;

  if (!name?.trim()) {
    return { success: false, error: "Name is required." };
  }
  if (!description?.trim()) {
    return { success: false, error: "Description is required." };
  }
  if (!ACHIEVEMENT_CONDITION_TYPES.includes(conditionType as never)) {
    return { success: false, error: "Invalid condition type." };
  }
  const value = parseInt(conditionValue, 10);
  if (isNaN(value) || value < 1) {
    return { success: false, error: "Condition value must be a positive number." };
  }

  try {
    await connectDB();
    const updates: {
      name?: string;
      description?: string;
      conditionType?: AchievementConditionType;
      conditionValue?: number;
      badge?: string;
    } = {
      name: name.trim(),
      description: description.trim(),
      conditionType: conditionType as AchievementConditionType,
      conditionValue: value,
    };

    if (badgeFile && badgeFile.size > 0) {
      const MAX_BADGE_BYTES = 512 * 1024;
      if (badgeFile.size > MAX_BADGE_BYTES) {
        return { success: false, error: "Badge image must be under 512 KB." };
      }
      const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
      if (!allowedMimes.includes(badgeFile.type)) {
        return { success: false, error: "Badge must be JPEG, PNG, WebP, GIF, or SVG." };
      }
      const buffer = Buffer.from(await badgeFile.arrayBuffer());
      updates.badge = `data:${badgeFile.type};base64,${buffer.toString("base64")}`;
    } else if (removeBadge) {
      updates.badge = "";
    }

    await updateAchievement(id, updates);
    revalidatePath("/admin/achievements");
    return { success: true, data: null };
  } catch {
    return { success: false, error: "Failed to update achievement." };
  }
}

export async function deleteAchievementAction(
  id: string,
): Promise<ActionResult<null>> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_ACHIEVEMENTS);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    await deleteAchievement(id);
    revalidatePath("/admin/achievements");
    return { success: true, data: null };
  } catch {
    return { success: false, error: "Failed to delete achievement." };
  }
}

export async function awardAllAchievementsAction(): Promise<
  ActionResult<{ awarded: number; total: number }>
> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_ACHIEVEMENTS);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    const result = await awardAllAchievements();
    revalidatePath("/admin/achievements");
    return { success: true, data: result };
  } catch {
    return { success: false, error: "Failed to award achievements." };
  }
}

export async function syncAllAchievementsAction(): Promise<
  ActionResult<{ awarded: number; revoked: number }>
> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_ACHIEVEMENTS);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    const result = await syncAllAchievements();
    revalidatePath("/admin/achievements");
    return { success: true, data: result };
  } catch {
    return { success: false, error: "Failed to sync achievements." };
  }
}
