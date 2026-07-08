import "server-only";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { StoreBook } from "@/models/StoreBook";
import { Ad } from "@/models/Ad";
import { Book } from "@/models/Book";
import type { StoreListItem, StoreBookDocument, RelevantStoreBook } from "@/types/store";
import type { AdDocument } from "@/types/ad";
import type { PaginatedResult } from "@/types/user";

function toStoreBookDocument(
  book: Record<string, unknown>,
): StoreBookDocument {
  return {
    _id: String(book._id),
    userId: String(book.userId),
    title: book.title as string,
    author: book.author as string,
    isbn: (book.isbn as string) ?? undefined,
    description: (book.description as string) ?? undefined,
    price: book.price as number,
    coverImage: (book.coverImage as string) ?? undefined,
    quantity: (book.quantity as number) ?? 1,
    createdAt: (book.createdAt as Date).toISOString(),
    updatedAt: (book.updatedAt as Date).toISOString(),
  };
}

function toAdDocument(ad: Record<string, unknown>): AdDocument {
  return {
    _id: String(ad._id),
    userId: String(ad.userId),
    title: ad.title as string,
    text: ad.text as string,
    image: (ad.image as string) ?? undefined,
    link: (ad.link as string) ?? undefined,
    status: ad.status as AdDocument["status"],
    createdAt: (ad.createdAt as Date).toISOString(),
    updatedAt: (ad.updatedAt as Date).toISOString(),
  };
}

export async function getStoreBooks(
  userId: string,
): Promise<StoreBookDocument[]> {
  await connectDB();
  const books = await StoreBook.find({ userId }).sort({ createdAt: -1 }).lean();
  return books.map(toStoreBookDocument);
}

export async function getStoreBookById(
  bookId: string,
): Promise<StoreBookDocument | null> {
  await connectDB();
  const book = await StoreBook.findById(bookId).lean();
  if (!book) return null;
  return toStoreBookDocument(book);
}

export async function getStoreAds(userId: string): Promise<AdDocument[]> {
  await connectDB();
  const ads = await Ad.find({ userId }).sort({ createdAt: -1 }).lean();
  return ads.map(toAdDocument);
}

export async function getAdById(adId: string): Promise<AdDocument | null> {
  await connectDB();
  const ad = await Ad.findById(adId).lean();
  if (!ad) return null;
  return toAdDocument(ad);
}

export async function listStores(
  page = 1,
  limit = 12,
): Promise<PaginatedResult<StoreListItem>> {
  await connectDB();

  const skip = (page - 1) * limit;

  const matchQuery = { isStore: true, username: { $exists: true, $ne: null } };

  const total = await User.countDocuments(matchQuery);
  if (total === 0) {
    return { items: [], hasMore: false };
  }

  const users = await User.find(matchQuery)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit + 1)
    .select("storeName storeDescription storeLogo storeCity storeImages username name storeLatitude storeLongitude")
    .lean();

  const hasMore = users.length > limit;
  const sliced = users.slice(0, limit);

  const items: StoreListItem[] = sliced.map((u) => {
    const user = u as Record<string, unknown>;
    return {
      _id: String(user._id),
      storeName: (user.storeName as string) || (user.name as string) || "Store",
      storeDescription: (user.storeDescription as string) ?? undefined,
      storeLogo: (user.storeLogo as string) ?? undefined,
      storeCity: (user.storeCity as string) ?? undefined,
      storeImages: (user.storeImages as string[]) ?? undefined,
      username: user.username as string,
      name: (user.name as string) ?? undefined,
      storeLatitude: (user.storeLatitude as number) ?? undefined,
      storeLongitude: (user.storeLongitude as number) ?? undefined,
    };
  });

  return { items, hasMore };
}

export async function getRelevantStoreBooks(
  userId: string,
): Promise<RelevantStoreBook[]> {
  await connectDB();

  const userBooks = await Book.find({ userId })
    .select("isbn13 authors")
    .lean();

  const wishlistIsbns = new Set<string>();
  const authorNames = new Set<string>();

  for (const book of userBooks) {
    if (book.isWishlist && book.isbn13) {
      wishlistIsbns.add(book.isbn13);
    }
    for (const author of book.authors) {
      if (author) authorNames.add(author.toLowerCase().trim());
    }
  }

  if (wishlistIsbns.size === 0 && authorNames.size === 0) {
    return [];
  }

  const stores = await User.find({
    isStore: true,
    storeName: { $exists: true, $ne: null },
  })
    .select("_id storeName storeCity username")
    .lean();

  if (stores.length === 0) return [];

  const results: RelevantStoreBook[] = [];

  for (const store of stores) {
    const storeId = store._id.toString();
    const storeName = (store as Record<string, unknown>).storeName as string;
    const storeCity = (store as Record<string, unknown>).storeCity as string | undefined;
    const username = (store as Record<string, unknown>).username as string;

    const storeBooks = await StoreBook.find({ userId: storeId }).lean();

    for (const sb of storeBooks) {
      const bookIsbn = (sb.isbn as string) ?? "";
      const bookAuthor = ((sb.author as string) ?? "").toLowerCase().trim();

      const matchesWishlist = wishlistIsbns.size > 0 && bookIsbn.length > 0
        ? wishlistIsbns.has(bookIsbn)
        : false;

      const matchesAuthor = authorNames.size > 0 && bookAuthor.length > 0
        ? authorNames.has(bookAuthor)
        : false;

      if (!matchesWishlist && !matchesAuthor) continue;

      results.push({
        ...toStoreBookDocument(sb as Record<string, unknown>),
        storeName,
        storeCity,
        storeUsername: username,
        matchReason: matchesWishlist ? "wishlist" : "author",
      });
    }
  }

  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return results.slice(0, 20);
}
