"use client";

import { useCallback, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { listUsersAction } from "@/actions/social";
import { UserCard } from "@/components/social/user-card";
import { Button } from "@/components/ui/button";
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
          <Button variant="outline" onClick={handleLoadMore} disabled={pending}>
            {pending ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </>
  );
}
