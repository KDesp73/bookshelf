import Link from "next/link";
import { NewsPostCard } from "@/components/blog/news-post-card";
import { getSessionUser } from "@/lib/auth/get-session-user";
import {
  getBulkPostReactionSummaries,
  listPublishedPosts,
} from "@/lib/blog/queries";
import type { BlogReactionSummary } from "@/types/blog";

function formatDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(
    new Date(value),
  );
}

export default async function NewsPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-amber-950 dark:text-amber-100 sm:text-3xl">
          News
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Updates from the BookShelf team.
        </p>
      </div>

      {dbError ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {dbError}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white/50 px-6 py-16 text-center dark:border-stone-600 dark:bg-stone-900/30">
          <p className="font-serif text-lg text-stone-700 dark:text-stone-300">
            No posts yet
          </p>
          <p className="mt-2 text-sm text-stone-500">
            Check back soon for updates.
          </p>
        </div>
      ) : (
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
      )}
    </div>
  );
}
