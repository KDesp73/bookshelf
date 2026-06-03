import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { getUserByUsername } from "@/lib/users/queries";
import { listPublicBooks, getAllTags, getBookCount } from "@/lib/books/queries";
import { getLikeCount, hasLiked } from "@/lib/social/queries";
import { parseLibraryFilters } from "@/lib/books/filters";
import { ProfileHeader } from "@/components/social/profile-header";
import { LibraryFilters } from "@/components/library/library-filters";
import { BookGrid } from "@/components/library/book-grid";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
  let liked = false;
  let dbError: string | null = null;

  try {
    [books, tags, bookCount, likeCount] = await Promise.all([
      listPublicBooks(user._id, filters),
      getAllTags(user._id),
      getBookCount(user._id),
      getLikeCount(user._id),
    ]);

    if (viewer?.id) {
      liked = await hasLiked(viewer.id, user._id);
    }
  } catch {
    dbError =
      "Could not connect to MongoDB. Set MONGODB_URI in .env.local and ensure the database is running.";
  }

  const isOwner = viewer?.id === user._id;

  return (
    <div className="space-y-6">
      <ProfileHeader
        user={user}
        bookCount={bookCount}
        likeCount={likeCount}
        liked={liked}
        isOwner={isOwner}
        viewerLoggedIn={!!viewer?.id}
      />

      <div>
        <h2 className="font-serif text-xl font-semibold text-amber-950 dark:text-amber-100">
          Collection
        </h2>
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
            <LibraryFilters tags={tags} basePath={`/u/${user.username}`} />
          </Suspense>
          <BookGrid
            books={books}
            isOwner={isOwner}
            showNotes={isOwner}
            canAddToWishlist={!!viewer?.username && !isOwner}
          />
        </>
      )}
    </div>
  );
}
