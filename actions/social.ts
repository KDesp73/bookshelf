"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { CollectionLike } from "@/models/CollectionLike";
import { getUserById } from "@/lib/users/queries";
import { requireUser } from "@/lib/auth/require-user";
import { listRecentBooks, listUsers } from "@/lib/social/queries";
import type { DiscoverBook } from "@/types/book";
import type { DiscoverFilters, PaginatedResult, UserListItem } from "@/types/user";
import type { ActionResult } from "@/actions/books";

export async function toggleCollectionLikeAction(
  targetUserId: string,
): Promise<ActionResult<{ liked: boolean; likeCount: number }>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Sign in required." };
  }

  if (auth.user.id === targetUserId) {
    return { success: false, error: "You cannot like your own collection." };
  }

  const targetUser = await getUserById(targetUserId);
  if (!targetUser?.username) {
    return { success: false, error: "User not found." };
  }

  try {
    await connectDB();

    const existing = await CollectionLike.findOne({
      likerId: auth.user.id,
      targetUserId,
    });

    let liked: boolean;

    if (existing) {
      await CollectionLike.deleteOne({ _id: existing._id });
      liked = false;
    } else {
      await CollectionLike.create({
        likerId: auth.user.id,
        targetUserId,
      });
      liked = true;
    }

    const likeCount = await CollectionLike.countDocuments({ targetUserId });

    revalidatePath(`/u/${targetUser.username}`);
    revalidatePath("/discover");

    return { success: true, data: { liked, likeCount } };
  } catch {
    return { success: false, error: "Could not update like." };
  }
}

export async function listUsersAction(
  filters: DiscoverFilters,
  page = 1,
): Promise<ActionResult<PaginatedResult<UserListItem>>> {
  try {
    const result = await listUsers(filters, page);
    return { success: true, data: result };
  } catch {
    return { success: false, error: "Failed to load users." };
  }
}

export async function listRecentBooksAction(): Promise<
  ActionResult<DiscoverBook[]>
> {
  try {
    const books = await listRecentBooks();
    return { success: true, data: books };
  } catch {
    return { success: false, error: "Failed to load books." };
  }
}
