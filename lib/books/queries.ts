import { connectDB } from "@/lib/db";
import { Book, type IBook } from "@/models/Book";
import type {
  BookDocument,
  LibraryFilters,
  PublicBookDocument,
} from "@/types/book";
import type { ReadingStatus } from "@/lib/constants";

function toBookDocument(
  book: IBook & { _id: { toString(): string } },
): BookDocument {
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
    genres: book.genres?.length ? book.genres : undefined,
    subjects: book.subjects?.length ? book.subjects : undefined,
    categories: book.categories?.length ? book.categories : undefined,
    language:
      book.langCode ??
      (book as IBook & { language?: string }).language ??
      undefined,
    publishYear: book.publishYear ?? undefined,
    openLibraryWorkKey: book.openLibraryWorkKey ?? undefined,
    googleVolumeId: book.googleVolumeId ?? undefined,
    status: book.status as ReadingStatus,
    tags: book.tags ?? [],
    notes: book.notes ?? undefined,
    rating: book.rating ?? undefined,
    isWishlist: book.isWishlist === true,
    dateAdded: book.dateAdded.toISOString(),
  };
}

function toPublicBookDocument(
  book: IBook & { _id: { toString(): string } },
): PublicBookDocument {
  const doc = toBookDocument(book);
  const { notes: _unusedNotes, ...publicDoc } = doc;
  void _unusedNotes;
  return publicDoc;
}

function applyListFilter(
  query: Record<string, unknown>,
  list: LibraryFilters["list"],
): void {
  if (list === "wishlist") {
    query.isWishlist = true;
  } else if (list === "all") {
    return;
  } else {
    query.isWishlist = { $ne: true };
  }
}

function buildBookQuery(
  userId: string,
  filters: LibraryFilters,
): Record<string, unknown> {
  const query: Record<string, unknown> = { userId };

  applyListFilter(query, filters.list ?? "library");

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

  return query;
}

export async function findBookByIsbn(
  isbn13: string,
  userId: string,
): Promise<BookDocument | null> {
  await connectDB();
  const book = await Book.findOne({ userId, isbn13 }).lean();
  if (!book) return null;
  return toBookDocument(book as IBook & { _id: { toString(): string } });
}

export async function findBookById(
  id: string,
  userId: string,
): Promise<BookDocument | null> {
  await connectDB();
  const book = await Book.findOne({ _id: id, userId }).lean();
  if (!book) return null;
  return toBookDocument(book as IBook & { _id: { toString(): string } });
}

export async function listBooks(
  userId: string,
  filters: LibraryFilters = {},
): Promise<BookDocument[]> {
  await connectDB();

  const query = buildBookQuery(userId, filters);
  const sortField = filters.sort === "title" ? "title" : "dateAdded";
  const sortOrder = filters.order === "asc" ? 1 : -1;

  const books = await Book.find(query)
    .sort({ [sortField]: sortOrder })
    .lean();

  return books.map((book) =>
    toBookDocument(book as IBook & { _id: { toString(): string } }),
  );
}

export async function listPublicBooks(
  userId: string,
  filters: LibraryFilters = {},
): Promise<PublicBookDocument[]> {
  await connectDB();

  const query = buildBookQuery(userId, { ...filters, list: "library" });
  const sortField = filters.sort === "title" ? "title" : "dateAdded";
  const sortOrder = filters.order === "asc" ? 1 : -1;

  const books = await Book.find(query)
    .select("-notes")
    .sort({ [sortField]: sortOrder })
    .lean();

  return books.map((book) =>
    toPublicBookDocument(book as IBook & { _id: { toString(): string } }),
  );
}

export async function listPublicWishlistBooks(
  userId: string,
  filters: LibraryFilters = {},
): Promise<PublicBookDocument[]> {
  await connectDB();

  const query = buildBookQuery(userId, { ...filters, list: "wishlist" });
  const sortField = filters.sort === "title" ? "title" : "dateAdded";
  const sortOrder = filters.order === "asc" ? 1 : -1;

  const books = await Book.find(query)
    .select("-notes")
    .sort({ [sortField]: sortOrder })
    .lean();

  return books.map((book) =>
    toPublicBookDocument(book as IBook & { _id: { toString(): string } }),
  );
}

export async function getAllTags(
  userId: string,
  list: LibraryFilters["list"] = "library",
): Promise<string[]> {
  await connectDB();
  const query: Record<string, unknown> = { userId };
  applyListFilter(query, list ?? "library");
  const tags = await Book.distinct("tags", query);
  return tags.filter(Boolean).sort((a, b) => a.localeCompare(b));
}

export async function getBookCount(userId: string): Promise<number> {
  await connectDB();
  return Book.countDocuments({ userId, isWishlist: { $ne: true } });
}

export async function getWishlistCount(userId: string): Promise<number> {
  await connectDB();
  return Book.countDocuments({ userId, isWishlist: true });
}
