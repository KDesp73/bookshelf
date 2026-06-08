import { Suspense } from "react";
import Link from "next/link";
import { listRecentBooks, listUsers } from "@/lib/social/queries";
import { DiscoverFilters } from "@/components/social/discover-filters";
import { UserCard } from "@/components/social/user-card";
import { BookCard } from "@/components/social/book-card";
import { LoadMoreUsers } from "@/components/social/load-more-users";
import { Button } from "@/components/ui/button";
import type { DiscoverFilters as DiscoverFiltersType } from "@/types/user";
import type { DiscoverBook } from "@/types/book";

interface DiscoverPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseDiscoverFilters(
  params: Record<string, string | string[] | undefined>,
): DiscoverFiltersType {
  const search = typeof params.search === "string" ? params.search : undefined;
  const sortRaw = typeof params.sort === "string" ? params.sort : "recent";
  const sort =
    sortRaw === "likes" || sortRaw === "books" || sortRaw === "recent"
      ? sortRaw
      : "recent";

  return { search, sort };
}

function parseTab(
  params: Record<string, string | string[] | undefined>,
): "collections" | "books" {
  const raw = typeof params.tab === "string" ? params.tab : "collections";
  return raw === "books" ? "books" : "collections";
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const params = await searchParams;
  const tab = parseTab(params);
  const filters = parseDiscoverFilters(params);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-amber-950 dark:text-amber-100 sm:text-3xl">
            {tab === "books" ? "Recent books" : "Discover collections"}
          </h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {tab === "books"
              ? "Explore recently added books from the community."
              : "Browse readers and explore their bookshelves."}
          </p>
        </div>
        <Button asChild>
          <Link href="/register">Create your shelf</Link>
        </Button>
      </div>

      <Suspense fallback={<div className="h-10 animate-pulse rounded-md bg-stone-200 dark:bg-stone-800" />}>
        <DiscoverFilters />
      </Suspense>

      {tab === "books" ? (
        <BooksTabContent />
      ) : (
        <CollectionsTabContent filters={filters} />
      )}
    </div>
  );
}

async function CollectionsTabContent({
  filters,
}: {
  filters: DiscoverFiltersType;
}) {
  let result: Awaited<ReturnType<typeof listUsers>> = { items: [], hasMore: false };
  let dbError: string | null = null;

  try {
    result = await listUsers(filters);
  } catch {
    dbError =
      "Could not connect to MongoDB. Set MONGODB_URI in .env.local and ensure the database is running.";
  }

  if (dbError) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        {dbError}
      </div>
    );
  }

  if (result.items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 bg-white/50 px-6 py-16 text-center dark:border-stone-600 dark:bg-stone-900/30">
        <p className="font-serif text-lg text-stone-700 dark:text-stone-300">
          No collections found
        </p>
        <p className="mt-2 text-sm text-stone-500">
          Be the first to share your shelf.
        </p>
      </div>
    );
  }

  return (
    <LoadMoreUsers initialUsers={result.items} initialHasMore={result.hasMore} />
  );
}

async function BooksTabContent() {
  let books: DiscoverBook[] = [];
  let dbError: string | null = null;

  try {
    books = await listRecentBooks();
  } catch {
    dbError =
      "Could not connect to MongoDB. Set MONGODB_URI in .env.local and ensure the database is running.";
  }

  if (dbError) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        {dbError}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 bg-white/50 px-6 py-16 text-center dark:border-stone-600 dark:bg-stone-900/30">
        <p className="font-serif text-lg text-stone-700 dark:text-stone-300">
          No books yet
        </p>
        <p className="mt-2 text-sm text-stone-500">
          Books added by readers will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {books.map((book) => (
        <BookCard key={book._id} book={book} />
      ))}
    </div>
  );
}
