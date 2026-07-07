import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BookCopy, MapPin, Megaphone, Phone, Store } from "lucide-react";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { getUserByUsername } from "@/lib/users/queries";
import {
  getLikeCount,
  hasLiked,
  listCollectionLikers,
} from "@/lib/social/queries";
import { getBookCount, getWishlistCount, listPublicBooks, getAllTags } from "@/lib/books/queries";
import { getFavoriteBooks } from "@/lib/books/favorites";
import { parseLibraryFilters } from "@/lib/books/filters";
import { profileUrl } from "@/lib/site-url";
import { connectDB } from "@/lib/db";
import { StoreBook } from "@/models/StoreBook";
import { Ad } from "@/models/Ad";
import { ProfileHeader } from "@/components/social/profile-header";
import { ProfileFavorites } from "@/components/social/profile-favorites";
import { ProfileListNav } from "@/components/social/profile-list-nav";
import { ProfileAchievements } from "@/components/social/profile-achievements";
import { ShelfThemeWrapper } from "@/components/shelf/shelf-theme-wrapper";
import { CollectionIOMenu } from "@/components/library/collection-io-menu";
import { LibraryFilters } from "@/components/library/library-filters";
import { BookGrid } from "@/components/library/book-grid";
import { Button } from "@/components/ui/button";
import { getUserAchievements } from "@/lib/achievements";

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
  let wishlistCount = 0;
  let favoriteBooks: Awaited<ReturnType<typeof getFavoriteBooks>> = [];
  let achievements: Awaited<ReturnType<typeof getUserAchievements>> = [];
  const isOwner = viewer?.id === user._id;

  let dbError: string | null = null;
  let storeBookCount = 0;
  let storePendingAdCount = 0;
  let storeApprovedAdCount = 0;

  try {
    [books, tags, bookCount, likeCount, wishlistCount, favoriteBooks, achievements] =
      await Promise.all([
      listPublicBooks(user._id, filters),
      getAllTags(user._id),
      getBookCount(user._id),
      getLikeCount(user._id),
      getWishlistCount(user._id),
      getFavoriteBooks(user._id, user.favoriteBookIds),
      getUserAchievements(user._id),
    ]);

    if (isOwner && user.isStore) {
      await connectDB();
      [storeBookCount, storePendingAdCount, storeApprovedAdCount] = await Promise.all([
        StoreBook.countDocuments({ userId: user._id }),
        Ad.countDocuments({ userId: user._id, status: "pending" }),
        Ad.countDocuments({ userId: user._id, status: "approved" }),
      ]);
    }

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
        viewerLoggedIn={!!viewer?.id}
        wishlistPublic={user.wishlistPublic}
      />

      <ProfileAchievements achievements={achievements} />

      <ProfileFavorites
        books={favoriteBooks}
        isOwner={isOwner}
        favoriteBookIds={user.favoriteBookIds}
      />

      <ProfileListNav
        username={user.username}
        active="collection"
        wishlistPublic={user.wishlistPublic}
        isOwner={isOwner}
        wishlistCount={wishlistCount}
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

      {isOwner && user.isStore ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 border-b border-amber-200 pb-3 dark:border-amber-800">
            <Store className="h-5 w-5 text-amber-800 dark:text-amber-300" />
            <h2 className="font-serif text-lg font-semibold text-amber-950 dark:text-amber-100">
              {user.storeName || "Store"}
            </h2>
          </div>

          {user.storeDescription ? (
            <p className="mt-3 text-sm text-stone-700 dark:text-stone-300">
              {user.storeDescription}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-3 text-sm text-stone-600 dark:text-stone-400">
            {user.storeAddress ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {user.storeAddress}
              </span>
            ) : null}
            {user.storePhone ? (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {user.storePhone}
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-stone-200 bg-white p-3 dark:border-stone-700 dark:bg-stone-900">
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <BookCopy className="h-4 w-4" />
                <span className="text-xs font-medium">Books</span>
              </div>
              <p className="mt-1 text-xl font-semibold text-stone-900 dark:text-stone-100">
                {storeBookCount}
              </p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-white p-3 dark:border-stone-700 dark:bg-stone-900">
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <Megaphone className="h-4 w-4" />
                <span className="text-xs font-medium">Pending ads</span>
              </div>
              <p className="mt-1 text-xl font-semibold text-stone-900 dark:text-stone-100">
                {storePendingAdCount}
              </p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-white p-3 dark:border-stone-700 dark:bg-stone-900">
              <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
                <Megaphone className="h-4 w-4" />
                <span className="text-xs font-medium">Approved ads</span>
              </div>
              <p className="mt-1 text-xl font-semibold text-stone-900 dark:text-stone-100">
                {storeApprovedAdCount}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/store/dashboard/books">
                <BookCopy className="h-4 w-4" />
                Manage books
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/store/dashboard/ads">
                <Megaphone className="h-4 w-4" />
                Manage ads
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings">
                <Store className="h-4 w-4" />
                Store settings
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

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
              favoriteBookIds={user.favoriteBookIds}
              canManageFavorites={isOwner}
            />
          </div>
        </>
      )}
    </ShelfThemeWrapper>
  );
}
