"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { UserListItem } from "@/types/user";

interface UserCardProps {
  user: UserListItem;
}

export function UserCard({ user }: UserCardProps) {
  return (
    <Link
      href={`/u/${user.username}`}
      className="group rounded-xl border border-stone-200/80 bg-white/60 p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-stone-700 dark:bg-stone-900/40"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-100 text-sm font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            (user.name?.[0] ?? user.username[0]).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-stone-900 group-hover:text-amber-900 dark:text-stone-100 dark:group-hover:text-amber-200">
            {user.name ?? user.username}
          </p>
          <p className="text-sm text-stone-500">@{user.username}</p>
          {user.bio ? (
            <p className="mt-2 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">
              {user.bio}
            </p>
          ) : null}
          <div className="mt-3 flex items-center gap-3 text-xs text-stone-500">
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {user.bookCount} {user.bookCount === 1 ? "book" : "books"}
            </span>
            <span>
              {user.likeCount} {user.likeCount === 1 ? "like" : "likes"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
