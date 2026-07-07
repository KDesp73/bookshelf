"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { StoreBook } from "@/models/StoreBook";
import { getStoreFromSession } from "@/lib/store/auth";

export type StoreBookActionState = {
  error?: string;
  success?: boolean;
};

export async function addStoreBookAction(
  _prevState: StoreBookActionState,
  formData: FormData,
): Promise<StoreBookActionState> {
  const store = await getStoreFromSession();
  if (!store) return { error: "Not authenticated." };

  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const isbn = String(formData.get("isbn") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price"));
  const coverImage = String(formData.get("coverImage") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);

  if (!title) return { error: "Title is required." };
  if (!author) return { error: "Author is required." };
  if (!price || price < 0) return { error: "Valid price is required." };

  try {
    await connectDB();
    await StoreBook.create({
      storeId: store._id,
      title,
      author,
      isbn: isbn || undefined,
      description: description || undefined,
      price,
      coverImage: coverImage || undefined,
      quantity,
    });
  } catch {
    return { error: "Could not add book. Try again." };
  }

  revalidatePath("/store/dashboard/books");
  return { success: true };
}

export async function updateStoreBookAction(
  _prevState: StoreBookActionState,
  formData: FormData,
): Promise<StoreBookActionState> {
  const store = await getStoreFromSession();
  if (!store) return { error: "Not authenticated." };

  const bookId = String(formData.get("bookId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const isbn = String(formData.get("isbn") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price"));
  const coverImage = String(formData.get("coverImage") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);

  if (!bookId) return { error: "Book ID is required." };
  if (!title) return { error: "Title is required." };
  if (!author) return { error: "Author is required." };
  if (!price || price < 0) return { error: "Valid price is required." };

  try {
    await connectDB();
    const book = await StoreBook.findOne({ _id: bookId, storeId: store._id });
    if (!book) return { error: "Book not found." };

    book.title = title;
    book.author = author;
    book.isbn = isbn || undefined;
    book.description = description || undefined;
    book.price = price;
    book.coverImage = coverImage || undefined;
    book.quantity = quantity;
    await book.save();
  } catch {
    return { error: "Could not update book. Try again." };
  }

  revalidatePath("/store/dashboard/books");
  return { success: true };
}

export async function deleteStoreBookAction(bookId: string): Promise<StoreBookActionState> {
  const store = await getStoreFromSession();
  if (!store) return { error: "Not authenticated." };

  try {
    await connectDB();
    await StoreBook.deleteOne({ _id: bookId, storeId: store._id });
  } catch {
    return { error: "Could not delete book." };
  }

  revalidatePath("/store/dashboard/books");
  return { success: true };
}
