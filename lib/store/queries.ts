import "server-only";
import { connectDB } from "@/lib/db";
import { StoreBook } from "@/models/StoreBook";
import { Ad } from "@/models/Ad";
import type { StoreBookDocument } from "@/types/store";
import type { AdDocument } from "@/types/ad";

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
