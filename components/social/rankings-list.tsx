"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { BookOpen, BookMarked, Heart, Award, Trophy } from "lucide-react";
import { listRankedUsersAction } from "@/actions/social";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/users/user-avatar";
import { ShelfThemeWrapper } from "@/components/shelf/shelf-theme-wrapper";
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
    return <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-amber-950">1</span>;
  }
  if (rank === 2) {
    return <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-300 text-sm font-bold text-stone-700">2</span>;
  }
  if (rank === 3) {
    return <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-700 text-sm font-bold text-amber-100">3</span>;
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
      className="overflow-hidden rounded-lg transition hover:-translate-y-0.5 hover:shadow-sm"
    >
      <Link href={`/u/${user.username}`} className="flex items-center gap-4 px-5 py-3">
        <RankBadge rank={rank} />
        <UserAvatar user={user} className="h-10 w-10 text-xs" />
        <div className="min-w-0 flex-1">
          <p className="shelf-title truncate font-medium">{user.name ?? user.username}</p>
          <p className="shelf-muted text-xs">@{user.username}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-amber-800 dark:text-amber-200">{statValue}</span>
          <span className="text-xs text-stone-500">{statSuffix}</span>
        </div>
      </Link>
    </ShelfThemeWrapper>
  );
}

export function RankingsList() {
  const [sort, setSort] = useState<RankingSort>("overall");
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [pending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  const loadRankings = useCallback((newSort: RankingSort, pageNum: number) => {
    startTransition(async () => {
      const result = await listRankedUsersAction(newSort, pageNum);
      if (result.success) {
        if (pageNum === 1) {
          setUsers(result.data.items);
        } else {
          setUsers((prev) => [...prev, ...result.data.items]);
        }
        setHasMore(result.data.hasMore);
        setPage(pageNum);
        setLoaded(true);
      }
    });
  }, []);

  const handleSortChange = useCallback((value: string) => {
    const newSort = value as RankingSort;
    setSort(newSort);
    loadRankings(newSort, 1);
  }, [loadRankings]);

  const handleLoadMore = useCallback(() => {
    loadRankings(sort, page + 1);
  }, [loadRankings, sort, page]);

  const ActiveIcon = SORT_OPTIONS.find((o) => o.value === sort)?.icon;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="grid w-full gap-2 sm:w-64">
          <Label htmlFor="rank-sort">Rank by</Label>
          <Select value={sort} onValueChange={handleSortChange}>
            <SelectTrigger id="rank-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    <opt.icon className="h-4 w-4" />
                    {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!loaded ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white/50 px-6 py-16 text-center dark:border-stone-600 dark:bg-stone-900/30">
          <div className="mb-3 flex justify-center">
            {ActiveIcon ? (
              <ActiveIcon className="h-10 w-10 text-stone-400" />
            ) : null}
          </div>
          <p className="font-serif text-lg text-stone-700 dark:text-stone-300">
            Select a ranking category to begin
          </p>
          <p className="mt-2 text-sm text-stone-500">
            View top readers ranked by overall score, books read, achievements, likes, or books added.
          </p>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white/50 px-6 py-16 text-center dark:border-stone-600 dark:bg-stone-900/30">
          <p className="font-serif text-lg text-stone-700 dark:text-stone-300">
            No users found
          </p>
          <p className="mt-2 text-sm text-stone-500">
            Users with a public profile will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
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
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white/80 px-6 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-white hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-600 dark:bg-stone-800/80 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
              >
                {pending ? "Loading\u2026" : "Load more"}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
