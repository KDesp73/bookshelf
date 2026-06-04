import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { userHasPassword } from "@/lib/auth/password";
import { getUserByUsername } from "@/lib/users/queries";
import { listPublicBooks, getAllTags, getBookCount } from "@/lib/books/queries";
import {
  getLikeCount,
  hasLiked,
  listCollectionLikers,
} from "@/lib/social/queries";
import { parseLibraryFilters } from "@/lib/books/filters";
import { profileUrl } from "@/lib/site-url";
import { ProfileHeader } from "@/components/social/profile-header";
import { ShelfThemeWrapper } from "@/components/shelf/shelf-theme-wrapper";
import { CollectionIOMenu } from "@/components/library/collection-io-menu";
import { LibraryFilters } from "@/components/library/library-filters";
import { BookGrid } from "@/components/library/book-grid";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user?.username) {
    return { title: "Profile not found" };
  }

  const displayName = user.name ?? user.username;
  const title = `${displayName} (@${user.username})`;
  const description =
    user.bio?.trim() ||
    `Browse ${displayName}'s book collection on BookShelf.`;
  const url = profileUrl(user.username);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "BookShelf",
      type: "profile",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function ProfilePage({
  params,
  searchParams,
}: ProfilePageProps) {
  const { username } = await params;
  const query = await searchParams;
  const filters = parseLibraryFilters(query);

  const viewer = await getSessionUser();
  const user = await getUserByUsername(username);

  if (!user?.username) {
    notFound();
  }

  let books: Awaited<ReturnType<typeof listPublicBooks>> = [];
  let tags: string[] = [];
  let bookCount = 0;
  let likeCount = 0;
  let likers: Awaited<ReturnType<typeof listCollectionLikers>> = [];
  let liked = false;
  let dbError: string | null = null;

  try {
    [books, tags, bookCount, likeCount] = await Promise.all([
      listPublicBooks(user._id, filters),
      getAllTags(user._id),
      getBookCount(user._id),
      getLikeCount(user._id),
    ]);

    if (likeCount > 0) {
      likers = await listCollectionLikers(user._id);
    }

    if (viewer?.id) {
      liked = await hasLiked(viewer.id, user._id);
    }
  } catch {
    dbError =
      "Could not connect to MongoDB. Set MONGODB_URI in .env.local and ensure the database is running.";
  }

  const isOwner = viewer?.id === user._id;
  const hasPassword = isOwner && viewer?.id ? await userHasPassword(viewer.id) : false;

  return (
    <ShelfThemeWrapper
      username={user.username}
      appearance={user.shelfAppearance}
      className="space-y-5 p-3 sm:space-y-6 sm:p-4"
    >
      <ProfileHeader
        user={user}
        bookCount={bookCount}
        likeCount={likeCount}
        likers={likers}
        liked={liked}
        isOwner={isOwner}
        hasPassword={hasPassword}
        viewerLoggedIn={!!viewer?.id}
      />

      <div className="space-y-3 sm:space-y-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="shelf-title font-serif text-xl font-semibold">
              Collection
            </h2>
            <p className="shelf-stats mt-1 text-sm">
              {books.length} {books.length === 1 ? "book" : "books"}
              {filters.search ? ` matching “${filters.search}”` : ""}
            </p>
          </div>
          {isOwner && !dbError ? (
            <CollectionIOMenu
              list="library"
              includeWishlistExports
              className="grid w-full grid-cols-2 sm:flex sm:w-auto"
            />
          ) : null}
        </div>
      </div>

      {dbError ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {dbError}
        </div>
      ) : (
        <>
          <Suspense fallback={<div className="h-10 animate-pulse rounded-md bg-stone-200 dark:bg-stone-800" />}>
            <LibraryFilters tags={tags} basePath={`/u/${user.username}`} />
          </Suspense>
          <div className="shelf-grid">
            <BookGrid
              books={books}
              isOwner={isOwner}
              showNotes={isOwner}
              canAddToWishlist={!!viewer?.username && !isOwner}
            />
          </div>
        </>
      )}
    </ShelfThemeWrapper>
  );
}
