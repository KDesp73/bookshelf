"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { Book } from "@/models/Book";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/auth/require-admin";
import { deleteUserAndData, listAllUsers } from "@/lib/admin/queries";
import { getUserById } from "@/lib/users/queries";
import { listBooks } from "@/lib/books/queries";
import {
  claimLegacyBooksForAdmin,
  getLegacyBookCount,
} from "@/lib/books/legacy";
import type { ActionResult } from "@/actions/books";
import type { LegacyClaimResult } from "@/lib/books/legacy";
import type { AdminUserRow, UserProfile } from "@/types/user";
import type { BookDocument } from "@/types/book";

export async function toggleUserAdminAction(
  userId: string,
): Promise<ActionResult<{ isAdmin: boolean }>> {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  if (auth.user.id === userId) {
    return { success: false, error: "You cannot change your own admin status." };
  }

  try {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: "User not found." };
    }

    user.isAdmin = !user.isAdmin;
    await user.save();

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);

    return { success: true, data: { isAdmin: user.isAdmin } };
  } catch {
    return { success: false, error: "Failed to update admin status." };
  }
}

export async function deleteUserAction(userId: string): Promise<ActionResult<null>> {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  if (auth.user.id === userId) {
    return { success: false, error: "You cannot delete your own account." };
  }

  try {
    const deleted = await deleteUserAndData(userId);
    if (!deleted) {
      return { success: false, error: "User not found." };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/users");
    revalidatePath("/discover");

    return { success: true, data: null };
  } catch {
    return { success: false, error: "Failed to delete user." };
  }
}

export async function deleteBookAsAdminAction(
  bookId: string,
  userId: string,
): Promise<ActionResult<null>> {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    await connectDB();
    const result = await Book.deleteOne({ _id: bookId, userId });
    if (result.deletedCount === 0) {
      return { success: false, error: "Book not found." };
    }

    const user = await getUserById(userId);
    revalidatePath("/admin");
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    if (user?.username) {
      revalidatePath(`/u/${user.username}`);
    }

    return { success: true, data: null };
  } catch {
    return { success: false, error: "Failed to delete book." };
  }
}

export async function getAdminUserDetailAction(
  userId: string,
): Promise<
  ActionResult<{
    user: UserProfile;
    books: BookDocument[];
  }>
> {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    const user = await getUserById(userId);
    if (!user) {
      return { success: false, error: "User not found." };
    }

    const books = await listBooks(userId, { list: "all" });
    return { success: true, data: { user, books } };
  } catch {
    return { success: false, error: "Failed to load user." };
  }
}

export async function listAllUsersAction(
  search?: string,
): Promise<ActionResult<AdminUserRow[]>> {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    const users = await listAllUsers(search);
    return { success: true, data: users };
  } catch {
    return { success: false, error: "Failed to load users." };
  }
}

export async function updateUserAsAdminAction(
  userId: string,
  updates: { name?: string; bio?: string; username?: string },
): Promise<ActionResult<UserProfile>> {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: "User not found." };
    }

    if (updates.name !== undefined) {
      user.name = updates.name.trim() || undefined;
    }
    if (updates.bio !== undefined) {
      user.bio = updates.bio.trim() || undefined;
    }
    if (updates.username !== undefined) {
      const username = updates.username.trim().toLowerCase();
      if (username) {
        const existing = await User.findOne({ username, _id: { $ne: userId } });
        if (existing) {
          return { success: false, error: "Username already taken." };
        }
        user.username = username;
      }
    }

    await user.save();

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    if (user.username) {
      revalidatePath(`/u/${user.username}`);
    }

    const profile = await getUserById(userId);
    if (!profile) {
      return { success: false, error: "User not found after update." };
    }

    return { success: true, data: profile };
  } catch {
    return { success: false, error: "Failed to update user." };
  }
}

export async function claimLegacyCollectionAction(): Promise<
  ActionResult<LegacyClaimResult>
> {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    const result = await claimLegacyBooksForAdmin(auth.user.id);
    return { success: true, data: result };
  } catch {
    return { success: false, error: "Failed to import legacy collection." };
  }
}

export async function getLegacyBookCountAction(): Promise<
  ActionResult<{ count: number }>
> {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    const count = await getLegacyBookCount();
    return { success: true, data: { count } };
  } catch {
    return { success: false, error: "Failed to count legacy books." };
  }
}
