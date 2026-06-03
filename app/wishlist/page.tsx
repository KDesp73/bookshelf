import { Suspense } from "react";
import { redirect } from "next/navigation";
import { listBooks, getAllTags } from "@/lib/books/queries";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { parseLibraryFilters } from "@/lib/books/filters";
import { LibraryFilters } from "@/components/library/library-filters";
import { BookGrid } from "@/components/library/book-grid";

interface WishlistPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function WishlistPage({ searchParams }: WishlistPageProps) {
  const user = await getSessionUser();
  const params = await searchParams;

  if (!user?.id) {
    redirect("/login?callbackUrl=/wishlist");
  }

  if (!user.username) {
    redirect("/onboarding");
  }

  const filters = { ...parseLibraryFilters(params), list: "wishlist" as const };

  let books: Awaited<ReturnType<typeof listBooks>> = [];
  let tags: string[] = [];
  let dbError: string | null = null;

  try {
    [books, tags] = await Promise.all([
      listBooks(user.id, filters),
      getAllTags(user.id, "wishlist"),
    ]);
  } catch {
    dbError =
      "Could not connect to MongoDB. Set MONGODB_URI in .env.local and ensure the database is running.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-amber-950 dark:text-amber-100 sm:text-3xl">
          Wishlist
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {books.length} {books.length === 1 ? "book" : "books"} you want to read
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
            <LibraryFilters tags={tags} basePath="/wishlist" hideStatusFilter />
          </Suspense>
          <BookGrid
            books={books}
            isOwner
            emptyMessage="Your wishlist is empty. Add books when scanning, or tap a book on someone else's profile."
          />
        </>
      )}
    </div>
  );
}
