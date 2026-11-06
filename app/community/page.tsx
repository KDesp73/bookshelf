import { Suspense } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  Newspaper,
  Users,
  type LucideIcon,
} from "lucide-react";
import { CommunityNav } from "@/components/social/community-nav";
import { DiscoverFilters } from "@/components/social/discover-filters";
import { RankingsList } from "@/components/social/rankings-list";
import { RecentBooksGrid } from "@/components/social/recent-books-grid";
import { LoadMoreUsers } from "@/components/social/load-more-users";
import { NewsPostCard } from "@/components/blog/news-post-card";
import { SuggestionsSection } from "@/components/social/suggestions-section";
import { listRecentBooks, listUsers } from "@/lib/social/queries";
import { getSessionUser } from "@/lib/auth/get-session-user";
import {
  getBulkPostReactionSummaries,
  listPublishedPosts,
} from "@/lib/blog/queries";
import type { DiscoverFilters as DiscoverFiltersType } from "@/types/user";
import type { DiscoverBook } from "@/types/book";
import type { BlogReactionSummary } from "@/types/blog";

interface CommunityPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type CommunityTab = "discover" | "rankings" | "news" | "suggestions";

const TAB_DESCRIPTIONS: Record<CommunityTab, string> = {
  discover:
    "Find new readers, browse their shelves, and let their collections inspire your next read.",
  rankings:
    "See who has been reading, collecting, and earning the most across BookShelf.",
  news: "Announcements, product updates, and notes from the people building BookShelf.",
  suggestions:
    "Have an idea that would make BookShelf better? Share it with us — every voice counts.",
};

function parseCommunityTab(
  params: Record<string, string | string[] | undefined>,
): CommunityTab {
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
    <div className="space-y-5">
      <CommunityHeader tab={tab} />

      <Suspense
        fallback={
          <div className="h-[106px] animate-pulse rounded-2xl bg-stone-200/70 sm:h-[58px] dark:bg-stone-800/70" />
        }
      >
        <CommunityNav activeTab={tab} />
      </Suspense>

      {tab === "rankings" ? (
        <Suspense fallback={<TabSkeleton variant="list" />}>
          <RankingsList />
        </Suspense>
      ) : tab === "news" ? (
        <Suspense fallback={<TabSkeleton variant="list" />}>
          <NewsSection />
        </Suspense>
      ) : tab === "suggestions" ? (
        <Suspense fallback={<TabSkeleton variant="form" />}>
          <SuggestionsSectionWrapper />
        </Suspense>
      ) : (
        <Suspense fallback={<TabSkeleton />}>
          <DiscoverSection params={params} />
        </Suspense>
      )}
    </div>
  );
}

function CommunityHeader({ tab }: { tab: CommunityTab }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-stone-100 p-5 sm:p-7 dark:border-amber-900/40 dark:from-amber-950/30 dark:via-stone-900 dark:to-stone-950">
      <Users
        aria-hidden
        strokeWidth={1}
        className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 text-amber-900/[0.05] sm:-right-4 sm:-top-12 sm:h-52 sm:w-52 dark:text-amber-100/[0.05]"
      />
      <div className="relative flex items-start gap-4 sm:items-center">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-800 text-amber-50 shadow-sm dark:bg-amber-900/70 dark:text-amber-100">
          <Users className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-800/70 dark:text-amber-300/70">
            Readers &amp; shelves
          </p>
          <h1 className="mt-0.5 font-serif text-2xl font-semibold text-amber-950 sm:text-3xl dark:text-amber-100">
            Community
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            {TAB_DESCRIPTIONS[tab]}
          </p>
        </div>
      </div>
    </section>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white/50 px-6 py-16 text-center dark:border-stone-600 dark:bg-stone-900/30">
      <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500">
        <Icon className="h-6 w-6" />
      </span>
      <p className="font-serif text-lg text-stone-700 dark:text-stone-300">
        {title}
      </p>
      <p className="mt-1.5 text-sm text-stone-500">{description}</p>
    </div>
  );
}

function TabSkeleton({ variant = "grid" }: { variant?: "grid" | "list" | "form" }) {
  if (variant === "form") {
    return (
      <div
        aria-hidden
        className="h-72 animate-pulse rounded-2xl bg-stone-200/60 dark:bg-stone-800/60"
      />
    );
  }

  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-10 w-full max-w-sm animate-pulse rounded-xl bg-stone-200/70 dark:bg-stone-800/70" />
      {variant === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-44 animate-pulse rounded-xl bg-stone-200/60 dark:bg-stone-800/60"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-lg bg-stone-200/60 dark:bg-stone-800/60"
            />
          ))}
        </div>
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
      <Suspense
        fallback={
          <div className="h-11 w-full max-w-md animate-pulse rounded-xl bg-stone-200/70 dark:bg-stone-800/70" />
        }
      >
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
    return <ErrorNotice message={dbError} />;
  }

  if (result.items.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No collections found"
        description="Be the first to share your shelf."
      />
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
    return <ErrorNotice message={dbError} />;
  }

  if (books.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No books yet"
        description="Books added by readers will appear here."
      />
    );
  }

  return <RecentBooksGrid books={books} />;
}

function formatDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(
    new Date(value),
  );
}

async function SuggestionsSectionWrapper() {
  return <SuggestionsSection />;
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
    return <ErrorNotice message={dbError} />;
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={Newspaper}
        title="No posts yet"
        description="Check back soon for updates."
      />
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
            reactions={reactionMap.get(post._id) ?? []}
            viewerLoggedIn={!!viewer}
            formattedDate={formatDate(post.publishedAt)}
          />
        ))}
      </div>
    </>
  );
}
