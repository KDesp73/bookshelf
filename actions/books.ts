"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { READING_STATUSES, isValidRating } from "@/lib/constants";
import { Book } from "@/models/Book";
import { normalizeIsbn } from "@/lib/books/isbn";
import { fetchBookByIsbn } from "@/lib/books/lookup";
import {
  findBookByIsbn,
  findBookById,
  listBooks,
  getAllTags,
} from "@/lib/books/queries";
import { requireUserWithUsername } from "@/lib/auth/require-user";
import type { BookDocument, BookInput, LibraryFilters } from "@/types/book";
import type { ReadingStatus } from "@/lib/constants";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function serializeBook(book: {
  _id: { toString(): string };
  userId: string;
  isbn13: string;
  title: string;
  subtitle?: string | null;
  authors?: string[] | null;
  publisher?: string | null;
  publishedDate?: string | null;
  description?: string | null;
  pageCount?: number | null;
  coverUrl?: string | null;
  status: string;
  tags?: string[] | null;
  notes?: string | null;
  rating?: number | null;
  dateAdded: Date;
  isWishlist?: boolean | null;
}): BookDocument {
  return {
    _id: book._id.toString(),
    userId: book.userId,
    isbn13: book.isbn13,
    title: book.title,
    subtitle: book.subtitle ?? undefined,
    authors: book.authors ?? [],
    publisher: book.publisher ?? undefined,
    publishedDate: book.publishedDate ?? undefined,
    description: book.description ?? undefined,
    pageCount: book.pageCount ?? undefined,
    coverUrl: book.coverUrl ?? undefined,
    status: book.status as ReadingStatus,
    tags: book.tags ?? [],
    notes: book.notes ?? undefined,
    rating: book.rating ?? undefined,
    isWishlist: book.isWishlist === true,
    dateAdded: book.dateAdded.toISOString(),
  };
}

function revalidateBookPaths(username: string) {
  revalidatePath("/");
  revalidatePath("/wishlist");
  revalidatePath("/scan");
  revalidatePath("/add");
  revalidatePath(`/u/${username}`);
}

export async function lookupIsbnAction(
  rawIsbn: string,
): Promise<
  ActionResult<
    | { type: "existing"; book: BookDocument }
    | { type: "preview"; preview: BookInput }
  >
> {
  const auth = await requireUserWithUsername();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Sign in required." };
  }

  const isbn13 = normalizeIsbn(rawIsbn);
  if (!isbn13) {
    return { success: false, error: "Invalid ISBN. Enter a valid 10 or 13 digit code." };
  }

  try {
    const existing = await findBookByIsbn(isbn13, auth.user.id);
    if (existing) {
      return { success: true, data: { type: "existing", book: existing } };
    }

    const preview = await fetchBookByIsbn(isbn13);
    if (!preview?.title) {
      return {
        success: false,
        error:
          "No metadata found for this ISBN. Add it manually from the Add page.",
      };
    }

    return {
      success: true,
      data: {
        type: "preview",
        preview: {
          ...preview,
          status: "Unread",
          tags: [],
        },
      },
    };
  } catch {
    return {
      success: false,
      error: "Could not look up this ISBN. Check your database connection.",
    };
  }
}

export async function saveBookAction(
  input: BookInput,
): Promise<ActionResult<BookDocument>> {
  const auth = await requireUserWithUsername();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Sign in required." };
  }

  const isbn13 = normalizeIsbn(input.isbn13) ?? input.isbn13;

  if (!input.title?.trim()) {
    return { success: false, error: "Title is required." };
  }

  if (input.rating != null && !isValidRating(input.rating)) {
    return { success: false, error: "Invalid rating." };
  }

  try {
    await connectDB();

    const existing = await Book.findOne({
      userId: auth.user.id,
      isbn13,
    });

    if (existing) {
      return {
        success: false,
        error: existing.isWishlist
          ? "Book already in your wishlist."
          : "Book already in your library.",
      };
    }

    const book = await Book.create({
      userId: auth.user.id,
      isbn13,
      title: input.title.trim(),
      subtitle: input.subtitle?.trim(),
      authors: input.authors?.filter(Boolean) ?? [],
      publisher: input.publisher?.trim(),
      publishedDate: input.publishedDate?.trim(),
      description: input.description?.trim(),
      pageCount: input.pageCount,
      coverUrl: input.coverUrl?.trim(),
      status: input.isWishlist ? "Unread" : (input.status ?? "Unread"),
      tags: input.tags?.map((t) => t.trim()).filter(Boolean) ?? [],
      notes: input.notes?.trim(),
      rating: input.isWishlist ? undefined : (input.rating ?? undefined),
      isWishlist: input.isWishlist === true,
    });

    revalidateBookPaths(auth.user.username!);

    return { success: true, data: serializeBook(book) };
  } catch {
    return { success: false, error: "Failed to save book." };
  }
}

export async function addToWishlistAction(
  input: BookInput,
): Promise<ActionResult<BookDocument>> {
  return saveBookAction({ ...input, isWishlist: true, status: "Unread", rating: null });
}

export async function moveToLibraryAction(
  id: string,
): Promise<ActionResult<BookDocument>> {
  const auth = await requireUserWithUsername();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Sign in required." };
  }

  try {
    await connectDB();

    const book = await Book.findOneAndUpdate(
      { _id: id, userId: auth.user.id, isWishlist: true },
      { isWishlist: false, status: "Unread" },
      { new: true },
    );

    if (!book) {
      return { success: false, error: "Wishlist item not found." };
    }

    revalidateBookPaths(auth.user.username!);

    const doc = await findBookById(id, auth.user.id);
    if (!doc) {
      return { success: false, error: "Book not found after update." };
    }

    return { success: true, data: doc };
  } catch {
    return { success: false, error: "Failed to move book to library." };
  }
}

export async function moveToWishlistAction(
  id: string,
): Promise<ActionResult<BookDocument>> {
  const auth = await requireUserWithUsername();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Sign in required." };
  }

  try {
    await connectDB();

    const book = await Book.findOneAndUpdate(
      { _id: id, userId: auth.user.id, isWishlist: { $ne: true } },
      { isWishlist: true, rating: undefined },
      { new: true },
    );

    if (!book) {
      return { success: false, error: "Book not found." };
    }

    revalidateBookPaths(auth.user.username!);

    const doc = await findBookById(id, auth.user.id);
    if (!doc) {
      return { success: false, error: "Book not found after update." };
    }

    return { success: true, data: doc };
  } catch {
    return { success: false, error: "Failed to move book to wishlist." };
  }
}

export async function updateBookAction(
  id: string,
  updates: Partial<BookInput> & { status?: ReadingStatus; rating?: number | null },
): Promise<ActionResult<BookDocument>> {
  const auth = await requireUserWithUsername();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Sign in required." };
  }

  if (updates.status && !READING_STATUSES.includes(updates.status)) {
    return { success: false, error: "Invalid reading status." };
  }

  if (updates.rating !== undefined && updates.rating !== null && !isValidRating(updates.rating)) {
    return { success: false, error: "Invalid rating." };
  }

  try {
    await connectDB();

    const book = await Book.findOneAndUpdate(
      { _id: id, userId: auth.user.id },
      {
        ...(updates.title !== undefined && { title: updates.title.trim() }),
        ...(updates.subtitle !== undefined && {
          subtitle: updates.subtitle?.trim(),
        }),
        ...(updates.authors !== undefined && { authors: updates.authors }),
        ...(updates.publisher !== undefined && {
          publisher: updates.publisher?.trim(),
        }),
        ...(updates.publishedDate !== undefined && {
          publishedDate: updates.publishedDate?.trim(),
        }),
        ...(updates.description !== undefined && {
          description: updates.description?.trim(),
        }),
        ...(updates.pageCount !== undefined && { pageCount: updates.pageCount }),
        ...(updates.coverUrl !== undefined && {
          coverUrl: updates.coverUrl?.trim(),
        }),
        ...(updates.status !== undefined && { status: updates.status }),
        ...(updates.tags !== undefined && {
          tags: updates.tags.map((t) => t.trim()).filter(Boolean),
        }),
        ...(updates.notes !== undefined && { notes: updates.notes?.trim() }),
        ...(updates.rating !== undefined && {
          rating: updates.rating === null ? undefined : updates.rating,
        }),
      },
      { new: true },
    );

    if (!book) {
      return { success: false, error: "Book not found." };
    }

    revalidateBookPaths(auth.user.username!);

    const doc = await findBookById(id, auth.user.id);
    if (!doc) {
      return { success: false, error: "Book not found after update." };
    }

    return { success: true, data: doc };
  } catch {
    return { success: false, error: "Failed to update book." };
  }
}

export async function deleteBookAction(id: string): Promise<ActionResult<null>> {
  const auth = await requireUserWithUsername();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Sign in required." };
  }

  try {
    await connectDB();
    const result = await Book.deleteOne({ _id: id, userId: auth.user.id });
    if (result.deletedCount === 0) {
      return { success: false, error: "Book not found." };
    }
    revalidateBookPaths(auth.user.username!);
    return { success: true, data: null };
  } catch {
    return { success: false, error: "Failed to delete book." };
  }
}

export async function getLibraryBooksAction(
  filters: LibraryFilters,
): Promise<ActionResult<BookDocument[]>> {
  const auth = await requireUserWithUsername();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Sign in required." };
  }

  try {
    const books = await listBooks(auth.user.id, filters);
    return { success: true, data: books };
  } catch {
    return { success: false, error: "Failed to load library." };
  }
}

export async function getFilterOptionsAction(): Promise<
  ActionResult<{ tags: string[] }>
> {
  const auth = await requireUserWithUsername();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Sign in required." };
  }

  try {
    const tags = await getAllTags(auth.user.id);
    return { success: true, data: { tags } };
  } catch {
    return { success: false, error: "Failed to load filter options." };
  }
}
