import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { getUserByUsername } from "@/lib/users/queries";
import {
  getAllTags,
  getWishlistCount,
  listPublicWishlistBooks,
} from "@/lib/books/queries";
import { parseLibraryFilters } from "@/lib/books/filters";
import { ProfileListNav } from "@/components/social/profile-list-nav";
import { ShelfThemeWrapper } from "@/components/shelf/shelf-theme-wrapper";
import { LibraryFilters } from "@/components/library/library-filters";
import { BookGrid } from "@/components/library/book-grid";

interface PublicWishlistPageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: PublicWishlistPageProps): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user?.username) {
    return { title: "Wishlist not found" };
  }

  const displayName = user.name ?? user.username;
  return {
    title: `${displayName}'s wishlist (@${user.username})`,
    description: `Books ${displayName} wants to read on BookShelf.`,
  };
}

export default async function PublicWishlistPage({
  params,
  searchParams,
}: PublicWishlistPageProps) {
  const { username } = await params;
  const query = await searchParams;
  const filters = parseLibraryFilters(query);

  const viewer = await getSessionUser();
  const user = await getUserByUsername(username);

  if (!user?.username) {
    notFound();
  }

  const isOwner = viewer?.id === user._id;
  if (!user.wishlistPublic && !isOwner) {
    notFound();
  }

  let books: Awaited<ReturnType<typeof listPublicWishlistBooks>> = [];
  let tags: string[] = [];
  let wishlistCount = 0;
  let dbError: string | null = null;

  try {
    [books, tags, wishlistCount] = await Promise.all([
      listPublicWishlistBooks(user._id, filters),
      getAllTags(user._id, "wishlist"),
      getWishlistCount(user._id),
    ]);
  } catch {
    dbError =
      "Could not connect to MongoDB. Set MONGODB_URI in .env.local and ensure the database is running.";
  }

  const displayName = user.name ?? user.username;

  return (
    <ShelfThemeWrapper
      username={user.username}
      appearance={user.shelfAppearance}
      className="space-y-5 p-3 sm:space-y-6 sm:p-4"
    >
      <div>
        <h1 className="shelf-title font-serif text-2xl font-semibold sm:text-3xl">
          {isOwner ? "Wishlist" : `${displayName}'s wishlist`}
        </h1>
        <p className="shelf-stats mt-1 text-sm">
          {books.length} {books.length === 1 ? "book" : "books"}
          {filters.search ? ` matching “${filters.search}”` : ""}
          {!isOwner ? (
            <>
              {" · "}
              <Link
                href={`/u/${user.username}`}
                className="font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
              >
                View collection
              </Link>
            </>
          ) : null}
        </p>
      </div>

      <ProfileListNav
        username={user.username}
        active="wishlist"
        wishlistPublic={user.wishlistPublic}
        isOwner={isOwner}
        wishlistCount={wishlistCount}
      />

      {dbError ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {dbError}
        </div>
      ) : (
        <>
          <Suspense
            fallback={
              <div className="h-10 animate-pulse rounded-md bg-stone-200 dark:bg-stone-800" />
            }
          >
            <LibraryFilters
              tags={tags}
              basePath={`/u/${user.username}/wishlist`}
              hideStatusFilter
            />
          </Suspense>
          <div className="shelf-grid">
            <BookGrid
              books={books}
              isOwner={isOwner}
              showNotes={isOwner}
              canAddToWishlist={!!viewer?.username && !isOwner}
              emptyMessage={
                isOwner
                  ? "Your wishlist is empty."
                  : `${displayName} hasn't added any books to their wishlist yet.`
              }
            />
          </div>
        </>
      )}
    </ShelfThemeWrapper>
  );
}
