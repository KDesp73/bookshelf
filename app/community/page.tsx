import { Suspense } from "react";
import Link from "next/link";
import { CommunityNav } from "@/components/social/community-nav";
import { DiscoverFilters } from "@/components/social/discover-filters";
import { RankingsList } from "@/components/social/rankings-list";
import { BookCard } from "@/components/social/book-card";
import { LoadMoreUsers } from "@/components/social/load-more-users";
import { NewsPostCard } from "@/components/blog/news-post-card";
import { SuggestionsSection } from "@/components/social/suggestions-section";
import { listRecentBooks, listUsers } from "@/lib/social/queries";
import { getSessionUser } from "@/lib/auth/get-session-user";
import {
  getBulkPostReactionSummaries,
  listPublishedPosts,
} from "@/lib/blog/queries";
import { listSuggestionsAction } from "@/actions/suggestions";
import { isAdminEmail } from "@/lib/auth/admin";
import { ADMIN_PERMISSIONS } from "@/lib/constants";
import type { DiscoverFilters as DiscoverFiltersType } from "@/types/user";
import type { DiscoverBook } from "@/types/book";
import type { BlogReactionSummary } from "@/types/blog";
import type { SuggestionItem } from "@/types/suggestion";

interface CommunityPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseCommunityTab(
  params: Record<string, string | string[] | undefined>,
): "discover" | "rankings" | "news" | "suggestions" {
  const raw = typeof params.tab === "string" ? params.tab : "discover";
  if (raw === "rankings") return "rankings";
  if (raw === "news") return "news";
  if (raw === "suggestions") return "suggestions";
  return "discover";
}

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  const params = await searchParams;
  const tab = parseCommunityTab(params);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-amber-950 dark:text-amber-100 sm:text-3xl">
          Community
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Discover readers, browse rankings, and explore bookshelves.
        </p>
      </div>

      <Suspense fallback={<div className="h-10 animate-pulse rounded-md bg-stone-200 dark:bg-stone-800" />}>
        <CommunityNav activeTab={tab} />
      </Suspense>

      {tab === "rankings" ? (
        <Suspense fallback={<div className="h-10 animate-pulse rounded-md bg-stone-200 dark:bg-stone-800" />}>
          <RankingsList />
        </Suspense>
      ) : tab === "news" ? (
        <NewsSection />
      ) : tab === "suggestions" ? (
        <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-stone-200 dark:bg-stone-800" />}>
          <SuggestionsSectionWrapper />
        </Suspense>
      ) : (
        <DiscoverSection params={params} />
      )}
    </div>
  );
}

function parseDiscoverSubTab(
  params: Record<string, string | string[] | undefined>,
): "collections" | "books" {
  const raw = typeof params.st === "string" ? params.st : "collections";
  return raw === "books" ? "books" : "collections";
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

async function DiscoverSection({
  params,
}: {
  params: Record<string, string | string[] | undefined>;
}) {
  const tab = parseDiscoverSubTab(params);
  const filters = parseDiscoverFilters(params);

  return (
    <>
      <Suspense fallback={<div className="h-10 animate-pulse rounded-md bg-stone-200 dark:bg-stone-800" />}>
        <DiscoverFilters basePath="/community" subTabKey="st" />
      </Suspense>

      {tab === "books" ? (
        <BooksTabContent />
      ) : (
        <CollectionsTabContent filters={filters} />
      )}
    </>
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

function formatDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(
    new Date(value),
  );
}

async function SuggestionsSectionWrapper() {
  const user = await getSessionUser();
  const canView =
    user !== null &&
    user.isAdmin &&
    (isAdminEmail(user.email) || user.adminPermissions.includes(ADMIN_PERMISSIONS.MANAGE_SUGGESTIONS));

  let items: SuggestionItem[] = [];
  let dbError: string | null = null;

  if (canView) {
    try {
      const result = await listSuggestionsAction();
      if (result.success) {
        items = result.data;
      } else {
        dbError = result.error ?? "Could not load suggestions.";
      }
    } catch {
      dbError = "Could not connect to MongoDB.";
    }
  }

  return <SuggestionsSection initialSuggestions={items} initialError={dbError} canView={canView} />;
}

async function NewsSection() {
  let posts: Awaited<ReturnType<typeof listPublishedPosts>> = [];
  let dbError: string | null = null;

  try {
    posts = await listPublishedPosts();
  } catch {
    dbError = "Could not load news. Check your database connection.";
  }

  const viewer = await getSessionUser();
  let reactionMap = new Map<string, BlogReactionSummary[]>();

  if (posts.length > 0) {
    try {
      reactionMap = await getBulkPostReactionSummaries(
        posts.map((post) => post._id),
        viewer?.id,
      );
    } catch {
      // Reactions are optional on the list page.
    }
  }

  if (dbError) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        {dbError}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 bg-white/50 px-6 py-16 text-center dark:border-stone-600 dark:bg-stone-900/30">
        <p className="font-serif text-lg text-stone-700 dark:text-stone-300">
          No posts yet
        </p>
        <p className="mt-2 text-sm text-stone-500">
          Check back soon for updates.
        </p>
      </div>
    );
  }

  return (
    <>
      {!viewer ? (
        <p className="text-sm text-stone-500">
          <Link
            href="/login"
            className="font-medium text-amber-800 dark:text-amber-300"
          >
            Sign in
          </Link>{" "}
          to react to posts.
        </p>
      ) : null}
      <div className="space-y-4">
        {posts.map((post) => (
          <NewsPostCard
            key={post._id}
            post={post}
            reactions={
              reactionMap.get(post._id) ??
              []
            }
            viewerLoggedIn={!!viewer}
            formattedDate={formatDate(post.publishedAt)}
          />
        ))}
      </div>
    </>
  );
}
