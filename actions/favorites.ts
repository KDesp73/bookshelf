"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { MAX_FAVORITE_BOOKS } from "@/lib/constants";
import { Book } from "@/models/Book";
import { User } from "@/models/User";
import { requireUserWithUsername } from "@/lib/auth/require-user";
import type { ActionResult } from "@/actions/books";

function revalidateFavoritePaths(username: string) {
  revalidatePath("/");
  revalidatePath(`/u/${username}`);
}

export async function toggleFavoriteBookAction(
  bookId: string,
): Promise<ActionResult<{ favoriteBookIds: string[]; isFavorite: boolean }>> {
  const auth = await requireUserWithUsername();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Sign in required." };
  }

  try {
    await connectDB();

    const book = await Book.findOne({
      _id: bookId,
      userId: auth.user.id,
      isWishlist: { $ne: true },
    }).lean();

    if (!book) {
      return { success: false, error: "Book not found in your library." };
    }

    const user = await User.findById(auth.user.id).select("favoriteBookIds").lean();
    if (!user) {
      return { success: false, error: "User not found." };
    }

    const current = user.favoriteBookIds ?? [];
    const isFavorite = current.includes(bookId);
    let next: string[];

    if (isFavorite) {
      next = current.filter((id) => id !== bookId);
    } else if (current.length >= MAX_FAVORITE_BOOKS) {
      return {
        success: false,
        error: `You can pin up to ${MAX_FAVORITE_BOOKS} favorite books.`,
      };
    } else {
      next = [...current, bookId];
    }

    await User.findByIdAndUpdate(auth.user.id, { favoriteBookIds: next });
    revalidateFavoritePaths(auth.user.username!);

    return {
      success: true,
      data: { favoriteBookIds: next, isFavorite: !isFavorite },
    };
  } catch {
    return { success: false, error: "Could not update favorites." };
  }
}
