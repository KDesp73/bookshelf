import { Suspense } from "react";
import { listBooks, getAllTags } from "@/lib/books/queries";
import { isAdmin } from "@/lib/auth/session";
import { parseLibraryFilters } from "@/lib/books/filters";
import { LibraryFilters } from "@/components/library/library-filters";
import { BookGrid } from "@/components/library/book-grid";

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const filters = parseLibraryFilters(params);

  let books: Awaited<ReturnType<typeof listBooks>> = [];
  let tags: string[] = [];
  let admin = false;
  let dbError: string | null = null;

  try {
    [books, tags, admin] = await Promise.all([
      listBooks(filters),
      getAllTags(),
      isAdmin(),
    ]);
  } catch {
    dbError =
      "Could not connect to MongoDB. Set MONGODB_URI in .env.local and ensure the database is running.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-amber-950 dark:text-amber-100 sm:text-3xl">
          My Library
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {books.length} {books.length === 1 ? "book" : "books"}
          {filters.search ? ` matching “${filters.search}”` : ""}
        </p>
      </div>

      {dbError ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {dbError}
        </div>
      ) : (
        <>
          <Suspense fallback={<div className="h-10 animate-pulse rounded-md bg-stone-200 dark:bg-stone-800" />}>
            <LibraryFilters tags={tags} />
          </Suspense>
          <BookGrid books={books} isAdmin={admin} />
        </>
      )}
    </div>
  );
}
