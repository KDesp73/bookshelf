import "server-only";
import { connectDB } from "@/lib/db";
import { Store } from "@/models/Store";
import { StoreBook } from "@/models/StoreBook";
import { Ad } from "@/models/Ad";
import type { StoreDocument, StoreBookDocument } from "@/types/store";
import type { AdDocument } from "@/types/ad";

function toStoreDocument(store: Record<string, unknown>): StoreDocument {
  return {
    _id: String(store._id),
    name: store.name as string,
    email: store.email as string,
    description: (store.description as string) ?? undefined,
    address: (store.address as string) ?? undefined,
    phone: (store.phone as string) ?? undefined,
    logo: (store.logo as string) ?? undefined,
    createdAt: (store.createdAt as Date).toISOString(),
    updatedAt: (store.updatedAt as Date).toISOString(),
  };
}

function toStoreBookDocument(
  book: Record<string, unknown>,
): StoreBookDocument {
  return {
    _id: String(book._id),
    storeId: String(book.storeId),
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
    storeId: String(ad.storeId),
    title: ad.title as string,
    text: ad.text as string,
    image: ad.image as string,
    link: (ad.link as string) ?? undefined,
    status: ad.status as AdDocument["status"],
    createdAt: (ad.createdAt as Date).toISOString(),
    updatedAt: (ad.updatedAt as Date).toISOString(),
  };
}

export async function getStoreById(id: string): Promise<StoreDocument | null> {
  await connectDB();
  const store = await Store.findById(id).lean();
  if (!store) return null;
  return toStoreDocument(store);
}

export async function getStoreByEmail(
  email: string,
): Promise<StoreDocument | null> {
  await connectDB();
  const store = await Store.findOne({ email: email.toLowerCase() }).lean();
  if (!store) return null;
  return toStoreDocument(store);
}

export async function getStoreBooks(
  storeId: string,
): Promise<StoreBookDocument[]> {
  await connectDB();
  const books = await StoreBook.find({ storeId }).sort({ createdAt: -1 }).lean();
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

export async function getStoreAds(storeId: string): Promise<AdDocument[]> {
  await connectDB();
  const ads = await Ad.find({ storeId }).sort({ createdAt: -1 }).lean();
  return ads.map(toAdDocument);
}

export async function getAdById(adId: string): Promise<AdDocument | null> {
  await connectDB();
  const ad = await Ad.findById(adId).lean();
  if (!ad) return null;
  return toAdDocument(ad);
}
