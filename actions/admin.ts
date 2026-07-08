"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { Book } from "@/models/Book";
import { User } from "@/models/User";
import { RecommendationModel } from "@/models/Recommendation";
import { requireAdmin, requirePermission } from "@/lib/auth/require-admin";
import { isAdminEmail } from "@/lib/auth/admin";
import { deleteUserAndData, listAllUsers } from "@/lib/admin/queries";
import { getUserById } from "@/lib/users/queries";
import { listBooks } from "@/lib/books/queries";
import { removeFavoriteBookId } from "@/lib/books/favorites";
import {
  backfillBookMetadata,
  countBooksNeedingMetadataEnrichment,
} from "@/lib/books/backfill-metadata";
import { StoreBook } from "@/models/StoreBook";
import { Ad } from "@/models/Ad";
import { ADMIN_PERMISSIONS, ALL_ADMIN_PERMISSIONS } from "@/lib/constants";
import type { AdminPermission } from "@/lib/constants";
import type { BackfillMetadataResult } from "@/lib/books/backfill-metadata";
import type { ActionResult } from "@/actions/books";
import type { AdminUserRow, UserProfile } from "@/types/user";
import type { BookDocument } from "@/types/book";
import { sendAdminPromotedEmail } from "@/lib/email/send-admin-notification";

export async function updateUserAdminPermissionsAction(
  userId: string,
  isAdmin: boolean,
  permissions?: AdminPermission[],
): Promise<ActionResult<{ isAdmin: boolean }>> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_USERS);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  if (auth.user.id === userId) {
    return { success: false, error: "You cannot change your own admin status." };
  }

  try {
    await connectDB();
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return { success: false, error: "User not found." };
    }

    if (isAdminEmail(targetUser.email)) {
      return { success: false, error: "Cannot modify the super admin's permissions." };
    }

    const wasAdmin = targetUser.isAdmin;
    targetUser.isAdmin = isAdmin;
    targetUser.adminPermissions = isAdmin ? (permissions ?? []) : [];
    await targetUser.save();

    if (isAdmin && !wasAdmin && targetUser.email) {
      sendAdminPromotedEmail(
        targetUser.email,
        auth.user.name ?? auth.user.email ?? "an admin",
      ).catch((err) =>
        console.error("[admin] failed to send promotion email:", err),
      );
    }

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);

    return { success: true, data: { isAdmin: targetUser.isAdmin } };
  } catch {
    return { success: false, error: "Failed to update admin status." };
  }
}

export async function deleteUserAction(userId: string): Promise<ActionResult<null>> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_USERS);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  if (auth.user.id === userId) {
    return { success: false, error: "You cannot delete your own account." };
  }

  try {
    await connectDB();
    const targetUser = await User.findById(userId).select("email").lean();
    if (!targetUser) {
      return { success: false, error: "User not found." };
    }
    if (isAdminEmail(targetUser.email)) {
      return { success: false, error: "Cannot delete the super admin." };
    }

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
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_BOOKS);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    await connectDB();
    const result = await Book.deleteOne({ _id: bookId, userId });
    if (result.deletedCount === 0) {
      return { success: false, error: "Book not found." };
    }
    await removeFavoriteBookId(userId, bookId);

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
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_USERS);
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
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_USERS);
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
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_USERS);
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

export async function backfillBookMetadataAction(): Promise<
  ActionResult<BackfillMetadataResult>
> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_METADATA);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    const result = await backfillBookMetadata({ limit: 500, delayMs: 250 });
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/discover");
    return { success: true, data: result };
  } catch {
    return { success: false, error: "Metadata enrichment failed." };
  }
}

export async function getBooksNeedingMetadataCountAction(): Promise<
  ActionResult<{ count: number }>
> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_METADATA);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    const count = await countBooksNeedingMetadataEnrichment();
    return { success: true, data: { count } };
  } catch {
    return { success: false, error: "Failed to count books." };
  }
}

export async function refreshRecommendationsAction(): Promise<
  ActionResult<{ deletedCount: number }>
> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_RECOMMENDATIONS);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    await connectDB();
    const result = await RecommendationModel.deleteMany({});
    revalidatePath("/");
    revalidatePath("/admin");
    return {
      success: true,
      data: { deletedCount: result.deletedCount },
    };
  } catch {
    return { success: false, error: "Failed to refresh recommendations." };
  }
}

export async function deleteAdminStoreBookAction(
  bookId: string,
): Promise<ActionResult<null>> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_STORES);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    await connectDB();
    await StoreBook.deleteOne({ _id: bookId });
    revalidatePath("/admin/stores");
    return { success: true, data: null };
  } catch {
    return { success: false, error: "Could not delete store book." };
  }
}

export async function revertStoreAction(
  userId: string,
): Promise<ActionResult<{ email: string }>> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_STORES);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    await connectDB();
    const user = await User.findByIdAndUpdate(
      userId,
      {
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
      },
      { new: true },
    );

    if (!user) {
      return { success: false, error: "User not found." };
    }

    if (auth.user.id === userId) {
      return { success: false, error: "You cannot revert your own store." };
    }

    revalidatePath("/admin/stores");
    if (userId) revalidatePath(`/admin/stores/${userId}`);
    revalidatePath("/stores");
    return { success: true, data: { email: user.email } };
  } catch {
    return { success: false, error: "Could not revert store. Try again." };
  }
}

export async function deleteStoreDataAction(
  userId: string,
): Promise<ActionResult<{ deletedBooks: number; deletedAds: number }>> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_STORES);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    await connectDB();
    const [bookResult, adResult] = await Promise.all([
      StoreBook.deleteMany({ userId }),
      Ad.deleteMany({ userId }),
    ]);

    revalidatePath("/admin/stores");
    if (userId) revalidatePath(`/admin/stores/${userId}`);
    return {
      success: true,
      data: {
        deletedBooks: bookResult.deletedCount,
        deletedAds: adResult.deletedCount,
      },
    };
  } catch {
    return { success: false, error: "Could not delete store data. Try again." };
  }
}

export async function approveAdAction(
  adId: string,
): Promise<ActionResult<null>> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_ADS);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    await connectDB();
    const result = await Ad.findByIdAndUpdate(adId, { status: "approved" });
    if (!result) return { success: false, error: "Ad not found." };
    revalidatePath("/admin/ads");
    revalidatePath("/admin/stores");
    return { success: true, data: null };
  } catch {
    return { success: false, error: "Could not approve ad." };
  }
}

export async function rejectAdAction(
  adId: string,
): Promise<ActionResult<null>> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_ADS);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    await connectDB();
    const result = await Ad.findByIdAndUpdate(adId, { status: "rejected" });
    if (!result) return { success: false, error: "Ad not found." };
    revalidatePath("/admin/ads");
    revalidatePath("/admin/stores");
    return { success: true, data: null };
  } catch {
    return { success: false, error: "Could not reject ad." };
  }
}
