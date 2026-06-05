import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { listAllPosts } from "@/lib/blog/queries";

function formatDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminNewsPage() {
  let posts: Awaited<ReturnType<typeof listAllPosts>> = [];
  let dbError: string | null = null;

  try {
    posts = await listAllPosts();
  } catch {
    dbError = "Could not load posts. Check your database connection.";
  }

  return (
    <>
      <AdminNav current="news" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-xl font-semibold text-amber-950 dark:text-amber-100">
            News posts
          </h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Write updates for the community. Only admins can publish.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/news/new">New post</Link>
        </Button>
      </div>

      {dbError ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {dbError}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white/50 px-6 py-12 text-center dark:border-stone-600 dark:bg-stone-900/30">
          <p className="text-stone-600 dark:text-stone-400">No posts yet.</p>
          <Button className="mt-4" asChild>
            <Link href="/admin/news/new">Write the first post</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200/80 bg-white/60 dark:border-stone-700 dark:bg-stone-900/40">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-stone-200 text-stone-500 dark:border-stone-700">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Published</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post._id}
                  className="border-b border-stone-100 last:border-0 dark:border-stone-800"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-stone-900 dark:text-stone-100">
                      {post.title}
                    </div>
                    <div className="text-xs text-stone-500">/news/{post.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        post.published
                          ? "text-green-700 dark:text-green-400"
                          : "text-stone-500"
                      }
                    >
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                    {formatDate(post.publishedAt)}
                  </td>
                  <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                    {formatDate(post.updatedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {post.published ? (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/news/${post.slug}`}>View</Link>
                        </Button>
                      ) : null}
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/news/${post._id}/edit`}>Edit</Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
