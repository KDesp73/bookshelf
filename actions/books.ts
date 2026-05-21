"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { DEFAULT_USER_ID, READING_STATUSES } from "@/lib/constants";
import { Book } from "@/models/Book";
import { normalizeIsbn } from "@/lib/books/isbn";
import { fetchBookByIsbn } from "@/lib/books/lookup";
import {
  findBookByIsbn,
  findBookById,
  listBooks,
  getAllTags,
} from "@/lib/books/queries";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { BookDocument, BookInput, LibraryFilters } from "@/types/book";
import type { ReadingStatus } from "@/lib/constants";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function lookupIsbnAction(
  rawIsbn: string,
): Promise<
  ActionResult<
    | { type: "existing"; book: BookDocument }
    | { type: "preview"; preview: BookInput }
  >
> {
  const authError = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const isbn13 = normalizeIsbn(rawIsbn);
  if (!isbn13) {
    return { success: false, error: "Invalid ISBN. Enter a valid 10 or 13 digit code." };
  }

  try {
    const existing = await findBookByIsbn(isbn13);
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
  const authError = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const isbn13 = normalizeIsbn(input.isbn13) ?? input.isbn13;

  if (!input.title?.trim()) {
    return { success: false, error: "Title is required." };
  }

  try {
    await connectDB();

    const existing = await Book.findOne({
      userId: DEFAULT_USER_ID,
      isbn13,
    });

    if (existing) {
      return { success: false, error: "Book already in library." };
    }

    const book = await Book.create({
      userId: DEFAULT_USER_ID,
      isbn13,
      title: input.title.trim(),
      subtitle: input.subtitle?.trim(),
      authors: input.authors?.filter(Boolean) ?? [],
      publisher: input.publisher?.trim(),
      publishedDate: input.publishedDate?.trim(),
      description: input.description?.trim(),
      pageCount: input.pageCount,
      coverUrl: input.coverUrl?.trim(),
      status: input.status ?? "Unread",
      tags: input.tags?.map((t) => t.trim()).filter(Boolean) ?? [],
      notes: input.notes?.trim(),
    });

    revalidatePath("/");
    revalidatePath("/scan");

    return {
      success: true,
      data: {
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
        dateAdded: book.dateAdded.toISOString(),
      },
    };
  } catch {
    return { success: false, error: "Failed to save book." };
  }
}

export async function updateBookAction(
  id: string,
  updates: Partial<BookInput> & { status?: ReadingStatus },
): Promise<ActionResult<BookDocument>> {
  const authError = await requireAdmin();
  if (authError) return { success: false, error: authError };

  if (updates.status && !READING_STATUSES.includes(updates.status)) {
    return { success: false, error: "Invalid reading status." };
  }

  try {
    await connectDB();

    const book = await Book.findOneAndUpdate(
      { _id: id, userId: DEFAULT_USER_ID },
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
      },
      { new: true },
    );

    if (!book) {
      return { success: false, error: "Book not found." };
    }

    revalidatePath("/");

    const doc = await findBookById(id);
    if (!doc) {
      return { success: false, error: "Book not found after update." };
    }

    return { success: true, data: doc };
  } catch {
    return { success: false, error: "Failed to update book." };
  }
}

export async function deleteBookAction(id: string): Promise<ActionResult<null>> {
  const authError = await requireAdmin();
  if (authError) return { success: false, error: authError };

  try {
    await connectDB();
    const result = await Book.deleteOne({ _id: id, userId: DEFAULT_USER_ID });
    if (result.deletedCount === 0) {
      return { success: false, error: "Book not found." };
    }
    revalidatePath("/");
    return { success: true, data: null };
  } catch {
    return { success: false, error: "Failed to delete book." };
  }
}

export async function getLibraryBooksAction(
  filters: LibraryFilters,
): Promise<ActionResult<BookDocument[]>> {
  try {
    const books = await listBooks(filters);
    return { success: true, data: books };
  } catch {
    return { success: false, error: "Failed to load library." };
  }
}

export async function getFilterOptionsAction(): Promise<
  ActionResult<{ tags: string[] }>
> {
  try {
    const tags = await getAllTags();
    return { success: true, data: { tags } };
  } catch {
    return { success: false, error: "Failed to load filter options." };
  }
}
