"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleBlogReactionAction } from "@/actions/blog";
import type { BlogReactionSummary } from "@/types/blog";
import { BLOG_REACTION_EMOJIS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface PostReactionsProps {
  postId: string;
  initialReactions: BlogReactionSummary[];
  viewerLoggedIn: boolean;
}

export function PostReactions({
  postId,
  initialReactions,
  viewerLoggedIn,
}: PostReactionsProps) {
  const [pending, startTransition] = useTransition();
  const [reactions, setReactions] = useState(initialReactions);
  const [error, setError] = useState<string | null>(null);

  function handleToggle(emoji: string) {
    if (!viewerLoggedIn || pending) return;
    setError(null);

    startTransition(async () => {
      const result = await toggleBlogReactionAction(postId, emoji);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setReactions(result.data.reactions);
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
        Reactions
      </p>
      <div className="flex flex-wrap gap-2">
        {BLOG_REACTION_EMOJIS.map((emoji) => {
          const summary = reactions.find((item) => item.emoji === emoji) ?? {
            emoji,
            count: 0,
            reacted: false,
          };

          return (
            <button
              key={emoji}
              type="button"
              disabled={!viewerLoggedIn || pending}
              onClick={() => handleToggle(emoji)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
                summary.reacted
                  ? "border-amber-400 bg-amber-100 text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100"
                  : "border-stone-200 bg-white/70 text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-300 dark:hover:bg-stone-900",
                !viewerLoggedIn && "cursor-default opacity-90",
              )}
              title={
                viewerLoggedIn
                  ? summary.reacted
                    ? "Remove reaction"
                    : "Add reaction"
                  : "Sign in to react"
              }
            >
              <span aria-hidden>{emoji}</span>
              <span className="tabular-nums">{summary.count}</span>
            </button>
          );
        })}
      </div>
      {!viewerLoggedIn ? (
        <p className="text-sm text-stone-500">
          <Link href="/login" className="font-medium text-amber-800 dark:text-amber-300">
            Sign in
          </Link>{" "}
          to react to this post.
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
