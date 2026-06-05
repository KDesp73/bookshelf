"use client";

import Link from "next/link";
import { PostReactions } from "@/components/blog/post-reactions";
import { SharePostButton } from "@/components/blog/share-post-button";
import type { BlogPostListItem, BlogReactionSummary } from "@/types/blog";

interface NewsPostCardProps {
  post: BlogPostListItem;
  reactions: BlogReactionSummary[];
  viewerLoggedIn: boolean;
  formattedDate: string;
}

export function NewsPostCard({
  post,
  reactions,
  viewerLoggedIn,
  formattedDate,
}: NewsPostCardProps) {
  return (
    <article className="rounded-xl border border-stone-200/80 bg-white/60 p-6 transition hover:border-amber-300 dark:border-stone-700 dark:bg-stone-900/40 dark:hover:border-amber-800">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/news/${post.slug}`} className="group min-w-0 flex-1 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-amber-950 group-hover:underline dark:text-amber-100">
            {post.title}
          </h2>
          {post.excerpt ? (
            <p className="text-stone-600 dark:text-stone-400">{post.excerpt}</p>
          ) : null}
          <p className="text-xs text-stone-500">
            {formattedDate}
            {post.authorName ? ` · ${post.authorName}` : ""}
          </p>
        </Link>
        <SharePostButton
          slug={post.slug}
          title={post.title}
          excerpt={post.excerpt}
          size="icon"
          variant="ghost"
        />
      </div>

      <div className="mt-4 border-t border-stone-200/80 pt-4 dark:border-stone-700">
        <PostReactions
          postId={post._id}
          initialReactions={reactions}
          viewerLoggedIn={viewerLoggedIn}
          compact
        />
      </div>
    </article>
  );
}
