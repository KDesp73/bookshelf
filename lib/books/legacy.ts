import "server-only";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { isAdminEmail } from "@/lib/auth/admin";
import { User } from "@/models/User";
import { Book } from "@/models/Book";

export const LEGACY_USER_IDS = [
  "default-user",
  process.env.BOOKSHELF_USER_ID?.trim(),
].filter((value, index, array): value is string => {
  return !!value && array.indexOf(value) === index;
});

export interface LegacyClaimResult {
  claimed: number;
  skipped: number;
  pending: number;
}

async function ensureAdminFromDb(userId: string): Promise<boolean> {
  const user = await User.findById(userId).select("email isAdmin").lean();
  if (!user) return false;

  const isAdmin = user.isAdmin || isAdminEmail(user.email);
  if (!isAdmin) return false;

  if (!user.isAdmin && isAdminEmail(user.email)) {
    await User.findByIdAndUpdate(userId, { isAdmin: true });
  }

  return true;
}

async function findLegacyBooks(adminUserId: string) {
  const knownUserIds = new Set(
    (await User.find({}, { _id: 1 }).lean()).map((user) =>
      user._id.toString(),
    ),
  );
  knownUserIds.add(adminUserId);

  return Book.find({
    $or: [
      { userId: { $in: LEGACY_USER_IDS } },
      { userId: { $exists: false } },
      { userId: null },
      { userId: "" },
      { userId: { $nin: [...knownUserIds] } },
    ],
  }).lean();
}

export async function getLegacyBookCount(): Promise<number> {
  await connectDB();

  const admin = await User.findOne({
    $or: [{ isAdmin: true }, ...(getAdminEmailFilter() ? [getAdminEmailFilter()!] : [])],
  })
    .select("_id")
    .lean();

  if (!admin) {
    return Book.countDocuments({ userId: { $in: LEGACY_USER_IDS } });
  }

  const legacyBooks = await findLegacyBooks(admin._id.toString());
  return legacyBooks.length;
}

function getAdminEmailFilter() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return email ? { email } : null;
}

/**
 * Moves legacy/orphan books to the admin account.
 * Checks admin status from the database, not the session cookie.
 */
export async function claimLegacyBooksForAdmin(
  userId: string,
): Promise<LegacyClaimResult> {
  await connectDB();

  const isAdmin = await ensureAdminFromDb(userId);
  if (!isAdmin) {
    return { claimed: 0, skipped: 0, pending: 0 };
  }

  const legacyBooks = await findLegacyBooks(userId);
  if (legacyBooks.length === 0) {
    return { claimed: 0, skipped: 0, pending: 0 };
  }

  let claimed = 0;
  let skipped = 0;

  for (const book of legacyBooks) {
    if (book.userId === userId) {
      skipped++;
      continue;
    }

    const duplicate = await Book.findOne({
      userId,
      isbn13: book.isbn13,
      _id: { $ne: book._id },
    });

    if (duplicate) {
      await Book.deleteOne({ _id: book._id });
      skipped++;
      continue;
    }

    await Book.updateOne({ _id: book._id }, { $set: { userId } });
    claimed++;
  }

  if (claimed > 0) {
    const admin = await User.findById(userId).select("username").lean();
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/discover");
    if (admin?.username) {
      revalidatePath(`/u/${admin.username}`);
    }
  }

  const pending = await findLegacyBooks(userId).then((books) => books.length);

  return { claimed, skipped, pending };
}
