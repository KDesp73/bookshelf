"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { UserListItem } from "@/types/user";
import { ShelfThemeWrapper } from "@/components/shelf/shelf-theme-wrapper";
import { UserAvatar } from "@/components/users/user-avatar";

interface UserCardProps {
  user: UserListItem;
}

export function UserCard({ user }: UserCardProps) {
  return (
    <ShelfThemeWrapper
      username={user.username}
      appearance={user.shelfAppearance}
      className="group overflow-hidden rounded-xl transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <Link href={`/u/${user.username}`} className="block p-5">
        <div className="flex items-start gap-4">
          <UserAvatar user={user} className="h-12 w-12 text-sm" />
          <div className="min-w-0 flex-1">
            <p className="shelf-title truncate font-medium group-hover:text-[var(--shelf-accent)]">
              {user.name ?? user.username}
            </p>
            <p className="shelf-muted text-sm">@{user.username}</p>
            {user.bio ? (
              <p className="shelf-muted mt-2 line-clamp-2 text-sm">{user.bio}</p>
            ) : null}
            <div className="shelf-stats mt-3 flex items-center gap-3 text-xs">
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
    </ShelfThemeWrapper>
  );
}
