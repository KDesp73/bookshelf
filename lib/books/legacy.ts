import "server-only";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { Book } from "@/models/Book";

export const LEGACY_USER_ID =
  process.env.BOOKSHELF_USER_ID?.trim() || "default-user";

/**
 * Moves books from the legacy single-user collection to an admin account.
 * Idempotent — safe to call on every library load for admins.
 */
export async function claimLegacyBooksForAdmin(
  adminUserId: string,
): Promise<number> {
  await connectDB();

  const legacyBooks = await Book.find({ userId: LEGACY_USER_ID }).lean();
  if (legacyBooks.length === 0) return 0;

  let claimed = 0;

  for (const book of legacyBooks) {
    const duplicate = await Book.findOne({
      userId: adminUserId,
      isbn13: book.isbn13,
    });

    if (duplicate) {
      await Book.deleteOne({ _id: book._id });
      continue;
    }

    await Book.updateOne({ _id: book._id }, { $set: { userId: adminUserId } });
    claimed++;
  }

  if (claimed > 0) {
    revalidatePath("/");
    revalidatePath("/discover");
  }

  return claimed;
}
