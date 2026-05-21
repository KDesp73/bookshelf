import { connectDB } from "@/lib/db";
import { DEFAULT_USER_ID } from "@/lib/constants";
import { Book, type IBook } from "@/models/Book";
import type { BookDocument, LibraryFilters } from "@/types/book";
import type { ReadingStatus } from "@/lib/constants";
function toBookDocument(book: IBook & { _id: { toString(): string } }): BookDocument {
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
    dateAdded: book.dateAdded.toISOString(),
  };
}

export async function findBookByIsbn(
  isbn13: string,
  userId = DEFAULT_USER_ID,
): Promise<BookDocument | null> {
  await connectDB();
  const book = await Book.findOne({ userId, isbn13 }).lean();
  if (!book) return null;
  return toBookDocument(book as IBook & { _id: { toString(): string } });
}

export async function findBookById(
  id: string,
  userId = DEFAULT_USER_ID,
): Promise<BookDocument | null> {
  await connectDB();
  const book = await Book.findOne({ _id: id, userId }).lean();
  if (!book) return null;
  return toBookDocument(book as IBook & { _id: { toString(): string } });
}

export async function listBooks(
  filters: LibraryFilters = {},
  userId = DEFAULT_USER_ID,
): Promise<BookDocument[]> {
  await connectDB();

  const query: Record<string, unknown> = { userId };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.tag) {
    query.tags = filters.tag;
  }

  if (filters.search?.trim()) {
    const term = filters.search.trim();
    query.$or = [
      { title: { $regex: term, $options: "i" } },
      { subtitle: { $regex: term, $options: "i" } },
      { authors: { $regex: term, $options: "i" } },
      { isbn13: { $regex: term, $options: "i" } },
      { tags: { $regex: term, $options: "i" } },
    ];
  }

  const sortField = filters.sort === "title" ? "title" : "dateAdded";
  const sortOrder = filters.order === "asc" ? 1 : -1;

  const books = await Book.find(query)
    .sort({ [sortField]: sortOrder })
    .lean();

  return books.map((book) =>
    toBookDocument(book as IBook & { _id: { toString(): string } }),
  );
}

export async function getAllTags(userId = DEFAULT_USER_ID): Promise<string[]> {
  await connectDB();
  const tags = await Book.distinct("tags", { userId });
  return tags.filter(Boolean).sort((a, b) => a.localeCompare(b));
}
