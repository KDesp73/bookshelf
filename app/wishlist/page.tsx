import { Suspense } from "react";
import { redirect } from "next/navigation";
import { listBooks, getAllTags } from "@/lib/books/queries";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { getUserByUsername } from "@/lib/users/queries";
import { parseLibraryFilters } from "@/lib/books/filters";
import { LibraryFilters } from "@/components/library/library-filters";
import { BookGrid } from "@/components/library/book-grid";
import { CollectionIOMenu } from "@/components/library/collection-io-menu";
import { ShelfThemeWrapper } from "@/components/shelf/shelf-theme-wrapper";

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
  const profile = await getUserByUsername(user.username);

  try {
    [books, tags] = await Promise.all([
      listBooks(user.id, filters),
      getAllTags(user.id, "wishlist"),
    ]);
  } catch {
    dbError =
      "Could not connect to MongoDB. Set MONGODB_URI in .env.local and ensure the database is running.";
  }

  if (!profile?.username) {
    redirect("/onboarding");
  }

  return (
    <ShelfThemeWrapper
      username={profile.username}
      appearance={profile.shelfAppearance}
      className="space-y-6 p-3 sm:p-4"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="shelf-title font-serif text-2xl font-semibold sm:text-3xl">
            Wishlist
          </h1>
          <p className="shelf-stats mt-1 text-sm">
            {books.length} {books.length === 1 ? "book" : "books"} you want to read
            {filters.search ? ` matching “${filters.search}”` : ""}
          </p>
        </div>
        {!dbError ? <CollectionIOMenu list="wishlist" /> : null}
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
          <div className="shelf-grid">
            <BookGrid
              books={books}
              isOwner
              emptyMessage="Your wishlist is empty. Add books when scanning, or tap a book on someone else's profile."
            />
          </div>
        </>
      )}
    </ShelfThemeWrapper>
  );
}
