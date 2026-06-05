import { connectDB } from "@/lib/db";
import { Book, type IBook } from "@/models/Book";
import { User } from "@/models/User";
import type { PublicBookDocument } from "@/types/book";

function toPublicBook(
  book: IBook & { _id: { toString(): string } },
): PublicBookDocument {
  const doc = {
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
    status: book.status as PublicBookDocument["status"],
    tags: book.tags ?? [],
    rating: book.rating ?? undefined,
    isWishlist: book.isWishlist === true,
    dateAdded: book.dateAdded.toISOString(),
  };
  return doc;
}

export async function getFavoriteBooks(
  userId: string,
  favoriteBookIds: string[],
): Promise<PublicBookDocument[]> {
  if (!favoriteBookIds.length) return [];

  await connectDB();

  const books = await Book.find({
    userId,
    _id: { $in: favoriteBookIds },
    isWishlist: { $ne: true },
  }).lean();

  const byId = new Map(
    books.map((book) => [
      (book as IBook & { _id: { toString(): string } })._id.toString(),
      book as IBook & { _id: { toString(): string } },
    ]),
  );

  return favoriteBookIds
    .map((id) => byId.get(id))
    .filter((book): book is IBook & { _id: { toString(): string } } => !!book)
    .map(toPublicBook);
}

export async function getFavoriteBooksForShare(
  userId: string,
  favoriteBookIds: string[],
  limit = 5,
): Promise<Array<{ title: string; coverUrl?: string }>> {
  const books = await getFavoriteBooks(userId, favoriteBookIds.slice(0, limit));
  return books.map((book) => ({
    title: book.title,
    coverUrl: book.coverUrl,
  }));
}

export async function removeFavoriteBookId(
  userId: string,
  bookId: string,
): Promise<void> {
  await connectDB();
  await User.findByIdAndUpdate(userId, {
    $pull: { favoriteBookIds: bookId },
  });
}
