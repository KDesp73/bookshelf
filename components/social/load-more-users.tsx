"use client";

import { useCallback, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { listUsersAction } from "@/actions/social";
import { UserCard } from "@/components/social/user-card";
import type { UserListItem } from "@/types/user";

interface LoadMoreUsersProps {
  initialUsers: UserListItem[];
  initialHasMore: boolean;
}

export function LoadMoreUsers({
  initialUsers,
  initialHasMore,
}: LoadMoreUsersProps) {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserListItem[]>(initialUsers);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    const search = searchParams.get("search") ?? undefined;
    const sortRaw = searchParams.get("sort") ?? "recent";
    const sort =
      sortRaw === "likes" || sortRaw === "books" || sortRaw === "recent"
        ? sortRaw
        : "recent";

    startTransition(async () => {
      const result = await listUsersAction({ search, sort }, nextPage);
      if (result.success) {
        setUsers((prev) => [...prev, ...result.data.items]);
        setHasMore(result.data.hasMore);
        setPage(nextPage);
      }
    });
  }, [page, searchParams]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <UserCard key={user._id} user={user} />
        ))}
      </div>

      {hasMore ? (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white/80 px-6 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-white hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-600 dark:bg-stone-800/80 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          >
            {pending ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}
    </>
  );
}
