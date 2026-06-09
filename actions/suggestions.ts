"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { Suggestion } from "@/models/Suggestion";
import { User } from "@/models/User";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/require-admin";
import { ADMIN_PERMISSIONS } from "@/lib/constants";
import type { SuggestionItem } from "@/types/suggestion";
import type { ActionResult } from "@/actions/books";

export async function submitSuggestionAction(
  content: string,
  isAnonymous: boolean,
): Promise<ActionResult<{ id: string }>> {
  const trimmed = content.trim();
  if (!trimmed) {
    return { success: false, error: "Suggestion cannot be empty." };
  }
  if (trimmed.length > 1000) {
    return { success: false, error: "Suggestion must be under 1000 characters." };
  }

  try {
    await connectDB();
    const user = await getSessionUser();

    const suggestion = await Suggestion.create({
      content: trimmed,
      userId: user?.id ?? undefined,
      isAnonymous,
    });

    revalidatePath("/community?tab=suggestions");
    return { success: true, data: { id: suggestion._id.toString() } };
  } catch {
    return { success: false, error: "Could not submit suggestion. Please try again." };
  }
}

export async function listSuggestionsAction(): Promise<ActionResult<SuggestionItem[]>> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_SUGGESTIONS);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    await connectDB();

    const suggestions = await Suggestion.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const userIds = suggestions
      .map((s) => s.userId?.toString())
      .filter(Boolean) as string[];

    const users = userIds.length > 0
      ? await User.find({ _id: { $in: userIds } })
          .select("name")
          .lean()
      : [];

    const userMap = new Map(users.map((u) => [u._id.toString(), u.name]));

    const items: SuggestionItem[] = suggestions.map((s) => ({
      _id: s._id.toString(),
      content: s.content,
      userId: s.userId?.toString(),
      userName: s.userId ? (userMap.get(s.userId.toString()) ?? "Anonymous") : undefined,
      isAnonymous: s.isAnonymous,
      status: s.status ?? "pending",
      createdAt: s.createdAt?.toISOString() ?? new Date().toISOString(),
    }));

    return { success: true, data: items };
  } catch {
    return { success: false, error: "Could not load suggestions." };
  }
}

export async function deleteSuggestionAction(
  suggestionId: string,
): Promise<ActionResult<null>> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_SUGGESTIONS);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    await connectDB();
    const result = await Suggestion.deleteOne({ _id: suggestionId });
    if (result.deletedCount === 0) {
      return { success: false, error: "Suggestion not found." };
    }

    revalidatePath("/admin/suggestions");
    return { success: true, data: null };
  } catch {
    return { success: false, error: "Failed to delete suggestion." };
  }
}

export async function updateSuggestionStatusAction(
  suggestionId: string,
  status: string,
): Promise<ActionResult<null>> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_SUGGESTIONS);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    await connectDB();
    const result = await Suggestion.findByIdAndUpdate(suggestionId, { status });
    if (!result) {
      return { success: false, error: "Suggestion not found." };
    }

    revalidatePath("/admin/suggestions");
    return { success: true, data: null };
  } catch {
    return { success: false, error: "Failed to update suggestion status." };
  }
}
