import Link from "next/link";
import { listPublishedPosts } from "@/lib/blog/queries";

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
        <div className="space-y-4">
          {posts.map((post) => (
            <article
              key={post._id}
              className="rounded-xl border border-stone-200/80 bg-white/60 p-6 transition hover:border-amber-300 dark:border-stone-700 dark:bg-stone-900/40 dark:hover:border-amber-800"
            >
              <Link href={`/news/${post.slug}`} className="group block space-y-2">
                <h2 className="font-serif text-xl font-semibold text-amber-950 group-hover:underline dark:text-amber-100">
                  {post.title}
                </h2>
                {post.excerpt ? (
                  <p className="text-stone-600 dark:text-stone-400">{post.excerpt}</p>
                ) : null}
                <p className="text-xs text-stone-500">
                  {formatDate(post.publishedAt)}
                  {post.authorName ? ` · ${post.authorName}` : ""}
                </p>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
