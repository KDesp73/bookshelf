"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { Book } from "@/models/Book";
import {
  defaultIsWishlistForList,
  normalizeImportBook,
  parseGoodreadsCsv,
  parseImportJson,
} from "@/lib/books/import";
import { metadataFieldsFromInput } from "@/lib/books/persist-metadata";
import { requireUserWithUsername } from "@/lib/auth/require-user";
import { isValidRating } from "@/lib/constants";
import type { BookListKind } from "@/types/book";
import type { ImportBookInput, ImportCollectionResult } from "@/types/export";

export type CollectionActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function revalidateBookPaths(username: string) {
  revalidatePath("/");
  revalidatePath("/wishlist");
  revalidatePath(`/u/${username}`);
}

export async function importCollectionAction(
  formData: FormData,
): Promise<CollectionActionResult<ImportCollectionResult>> {
  const auth = await requireUserWithUsername();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Sign in required." };
  }

  const listParam = String(formData.get("list") ?? "library");
  const list: BookListKind = listParam === "wishlist" ? "wishlist" : "library";
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Choose a file to import." };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "File must be 5 MB or smaller." };
  }

  let raw: string;
  try {
    raw = await file.text();
  } catch {
    return { success: false, error: "Could not read the file." };
  }

  const isCsv = file.name.toLowerCase().endsWith(".csv");

  let entries: ImportBookInput[];
  try {
    entries = isCsv ? parseGoodreadsCsv(raw) : parseImportJson(raw);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Invalid import file.",
    };
  }

  if (entries.length === 0) {
    return { success: false, error: "The import file contains no books." };
  }

  const defaultIsWishlist = defaultIsWishlistForList(list);
  const result: ImportCollectionResult = {
    imported: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  try {
    await connectDB();

    for (const entry of entries) {
      const normalized = normalizeImportBook(entry, defaultIsWishlist);
      if (normalized.error) {
        result.failed += 1;
        if (result.errors.length < 5) {
          result.errors.push(normalized.error);
        }
        continue;
      }

      const book = normalized.book;
      const existing = await Book.findOne({
        userId: auth.user.id,
        isbn13: book.isbn13,
      }).lean();

      if (existing) {
        result.skipped += 1;
        continue;
      }

      try {
        await Book.create({
          userId: auth.user.id,
          isbn13: book.isbn13,
          title: book.title,
          subtitle: book.subtitle,
          authors: book.authors ?? [],
          publisher: book.publisher,
          publishedDate: book.publishedDate,
          description: book.description,
          pageCount: book.pageCount,
          coverUrl: book.coverUrl,
          ...metadataFieldsFromInput(book),
          status: book.isWishlist ? "Unread" : (book.status ?? "Unread"),
          tags: book.tags ?? [],
          notes: book.notes,
          isWishlist: book.isWishlist,
          ...(book.isWishlist || book.rating == null || !isValidRating(book.rating)
            ? {}
            : { rating: book.rating }),
          ...(book.dateAdded ? { dateAdded: new Date(book.dateAdded) } : {}),
        });
        result.imported += 1;
      } catch {
        result.failed += 1;
        if (result.errors.length < 5) {
          result.errors.push(`Could not import "${book.title}".`);
        }
      }
    }
  } catch {
    return { success: false, error: "Import failed. Check your database connection." };
  }

  revalidateBookPaths(auth.user.username);

  return { success: true, data: result };
}
