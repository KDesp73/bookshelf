import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/blog/markdown-content";
import { PostReactions } from "@/components/blog/post-reactions";
import { SharePostButton } from "@/components/blog/share-post-button";
import { getSessionUser } from "@/lib/auth/get-session-user";
import {
  getPostReactionSummaries,
  getPublishedPostBySlug,
} from "@/lib/blog/queries";

interface NewsPostPageProps {
  params: Promise<{ slug: string }>;
}

function formatDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(
    new Date(value),
  );
}

export default async function NewsPostPage({ params }: NewsPostPageProps) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const viewer = await getSessionUser();
  const reactions = await getPostReactionSummaries(post._id, viewer?.id);

  return (
    <article className="space-y-8">
      <div className="space-y-3">
        <Link
          href="/news"
          className="text-sm font-medium text-amber-800 hover:underline dark:text-amber-300"
        >
          ← All news
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-semibold text-amber-950 dark:text-amber-100">
              {post.title}
            </h1>
            <p className="text-sm text-stone-500">
              {formatDate(post.publishedAt)}
              {post.authorName ? ` · ${post.authorName}` : ""}
            </p>
          </div>
          <SharePostButton
            slug={post.slug}
            title={post.title}
            excerpt={post.excerpt}
            className="shrink-0"
          />
        </div>
      </div>

      <MarkdownContent content={post.body} />

      <PostReactions
        postId={post._id}
        initialReactions={reactions}
        viewerLoggedIn={!!viewer}
      />
    </article>
  );
}
