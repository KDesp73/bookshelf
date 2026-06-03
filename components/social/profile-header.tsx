"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { toggleCollectionLikeAction } from "@/actions/social";
import type { UserProfile } from "@/types/user";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  user: UserProfile;
  bookCount: number;
  likeCount: number;
  liked: boolean;
  isOwner: boolean;
  viewerLoggedIn: boolean;
}

export function ProfileHeader({
  user,
  bookCount,
  likeCount,
  liked: initialLiked,
  isOwner,
  viewerLoggedIn,
}: ProfileHeaderProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(likeCount);

  function handleLike() {
    if (!viewerLoggedIn) return;

    startTransition(async () => {
      const result = await toggleCollectionLikeAction(user._id);
      if (!result.success) return;
      setLiked(result.data.liked);
      setCount(result.data.likeCount);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-stone-200/80 bg-white/60 p-6 dark:border-stone-700 dark:bg-stone-900/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-100 text-xl font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              (user.name?.[0] ?? user.username?.[0] ?? "?").toUpperCase()
            )}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-amber-950 dark:text-amber-100">
              {user.name ?? user.username}
            </h1>
            {user.username ? (
              <p className="text-sm text-stone-500">@{user.username}</p>
            ) : null}
            {user.bio ? (
              <p className="mt-2 max-w-xl text-sm text-stone-700 dark:text-stone-300">
                {user.bio}
              </p>
            ) : null}
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              {bookCount} {bookCount === 1 ? "book" : "books"} · {count}{" "}
              {count === 1 ? "like" : "likes"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          {isOwner ? (
            <Button variant="outline" size="sm" asChild>
              <Link href="/">Edit library</Link>
            </Button>
          ) : viewerLoggedIn ? (
            <Button
              variant={liked ? "default" : "outline"}
              size="sm"
              onClick={handleLike}
              disabled={pending}
            >
              <Heart className={cn("h-4 w-4", liked && "fill-current")} />
              {liked ? "Liked" : "Like collection"}
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/login?callbackUrl=/u/${user.username}`}>
                Sign in to like
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
