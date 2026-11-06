"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { BookOpen, BookMarked, Heart, Award, Trophy } from "lucide-react";
import { listRankedUsersAction } from "@/actions/social";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/users/user-avatar";
import { ShelfThemeWrapper } from "@/components/shelf/shelf-theme-wrapper";
import { cn } from "@/lib/utils";
import type { RankingSort, UserListItem } from "@/types/user";

const SORT_OPTIONS: { value: RankingSort; label: string; icon: typeof BookOpen }[] = [
  { value: "overall", label: "Overall", icon: Trophy },
  { value: "books_read", label: "Books read", icon: BookMarked },
  { value: "achievements", label: "Achievements", icon: Award },
  { value: "likes", label: "Most liked", icon: Heart },
  { value: "books_added", label: "Books added", icon: BookOpen },
];

function getStatValue(user: UserListItem, sort: RankingSort): number {
  switch (sort) {
    case "overall":
      return (user.readCount ?? 0) * 4 + (user.achievementCount ?? 0) * 3 + user.likeCount * 2 + user.bookCount;
    case "books_added": return user.bookCount;
    case "books_read": return user.readCount ?? 0;
    case "likes": return user.likeCount;
    case "achievements": return user.achievementCount ?? 0;
  }
}

function getStatSuffix(sort: RankingSort): string {
  switch (sort) {
    case "overall": return "pts";
    case "books_added": return "books";
    case "books_read": return "read";
    case "likes": return "likes";
    case "achievements": return "achievements";
  }
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-amber-950 shadow-sm">1</span>;
  }
  if (rank === 2) {
    return <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-300 text-sm font-bold text-stone-700 shadow-sm">2</span>;
  }
  if (rank === 3) {
    return <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-700 text-sm font-bold text-amber-100 shadow-sm">3</span>;
  }
  return <span className="flex h-8 w-8 items-center justify-center text-sm font-medium text-stone-400">{rank}</span>;
}

function RankingRow({
  user,
  sort,
  rank,
}: {
  user: UserListItem;
  sort: RankingSort;
  rank: number;
}) {
  const statValue = getStatValue(user, sort);
  const statSuffix = getStatSuffix(sort);

  return (
    <ShelfThemeWrapper
      username={user.username}
      appearance={user.shelfAppearance}
      className="overflow-hidden rounded-xl transition hover:-translate-y-0.5 hover:shadow-sm"
    >
      <Link href={`/u/${user.username}`} className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
        <RankBadge rank={rank} />
        <UserAvatar user={user} className="h-10 w-10 text-xs" />
        <div className="min-w-0 flex-1">
          <p className="shelf-title truncate font-medium">{user.name ?? user.username}</p>
          <p className="shelf-muted text-xs">@{user.username}</p>
        </div>
        <div className="flex shrink-0 items-baseline gap-1.5">
          <span className="text-lg font-bold text-amber-800 dark:text-amber-200">{statValue}</span>
          <span className="text-xs text-stone-500">{statSuffix}</span>
        </div>
      </Link>
    </ShelfThemeWrapper>
  );
}

function RankingsSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-xl border border-stone-200/60 bg-white/40 px-4 py-3 sm:gap-4 sm:px-5 dark:border-stone-800 dark:bg-stone-900/30"
        >
          <div className="h-8 w-8 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700" />
          <div className="h-10 w-10 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
            <div className="h-3 w-1/4 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
          </div>
          <div className="h-5 w-10 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
        </div>
      ))}
    </div>
  );
}

export function RankingsList() {
  const [sort, setSort] = useState<RankingSort>("overall");
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [pending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRankings = useCallback((newSort: RankingSort, pageNum: number) => {
    startTransition(async () => {
      setError(null);
      const result = await listRankedUsersAction(newSort, pageNum);
      if (!result.success) {
        setError(result.error);
        setLoaded(true);
        return;
      }
      if (pageNum === 1) {
        setUsers(result.data.items);
      } else {
        setUsers((prev) => [...prev, ...result.data.items]);
      }
      setHasMore(result.data.hasMore);
      setPage(pageNum);
      setLoaded(true);
    });
  }, []);

  const handleSortChange = useCallback((value: RankingSort) => {
    setSort(value);
    setLoaded(false);
    loadRankings(value, 1);
  }, [loadRankings]);

  const handleLoadMore = useCallback(() => {
    loadRankings(sort, page + 1);
  }, [loadRankings, sort, page]);

  useEffect(() => {
    loadRankings("overall", 1);
  }, [loadRankings]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Rank by">
        {SORT_OPTIONS.map((option) => {
          const isActive = sort === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSortChange(option.value)}
              disabled={pending}
              aria-pressed={isActive}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                isActive
                  ? "border-amber-300 bg-amber-50 text-amber-900 shadow-sm dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100"
                  : "border-stone-200 bg-white/70 text-stone-600 hover:border-amber-300 hover:text-stone-900 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-400 dark:hover:border-amber-700 dark:hover:text-stone-100",
                pending && "opacity-60",
              )}
            >
              <option.icon className="h-3.5 w-3.5" />
              {option.label}
            </button>
          );
        })}
      </div>

      {sort === "overall" && loaded && !error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-stone-200/80 bg-stone-50/70 px-4 py-3 text-xs text-stone-500 dark:border-stone-800 dark:bg-stone-900/40 dark:text-stone-400">
          <Trophy className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p>
            Overall score = (books read &times; 4) + (achievements &times; 3) + (likes &times; 2) + (books added &times; 1)
          </p>
        </div>
      )}

      {error ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {error}
        </div>
      ) : !loaded ? (
        <RankingsSkeleton />
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white/50 px-6 py-16 text-center dark:border-stone-600 dark:bg-stone-900/30">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500">
            <Trophy className="h-6 w-6" />
          </span>
          <p className="font-serif text-lg text-stone-700 dark:text-stone-300">
            No users found
          </p>
          <p className="mt-1.5 text-sm text-stone-500">
            Users with a public profile will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className={cn("space-y-2 transition-opacity", pending && "opacity-60")}>
            {users.map((user, i) => (
              <RankingRow
                key={user._id}
                user={user}
                sort={sort}
                rank={page > 1 ? (page - 1) * 20 + i + 1 : i + 1}
              />
            ))}
          </div>

          {hasMore ? (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={handleLoadMore} disabled={pending}>
                {pending ? "Loading…" : "Load more"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
