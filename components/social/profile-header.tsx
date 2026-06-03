"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Heart, LogOut, Pencil } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { toggleCollectionLikeAction } from "@/actions/social";
import type { UserProfile } from "@/types/user";
import { ProfileEditDialog } from "@/components/social/profile-edit-dialog";
import { UserAvatar } from "@/components/users/user-avatar";
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
  const [editOpen, setEditOpen] = useState(false);

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
    <>
      <div className="rounded-xl border border-stone-200/80 bg-white/60 p-6 dark:border-stone-700 dark:bg-stone-900/40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <UserAvatar user={user} className="h-16 w-16 text-xl" />
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
              ) : isOwner ? (
                <p className="mt-2 max-w-xl text-sm text-stone-500">
                  Add a bio to tell people about your reading taste.
                </p>
              ) : null}
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                {bookCount} {bookCount === 1 ? "book" : "books"} · {count}{" "}
                {count === 1 ? "like" : "likes"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {isOwner ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                  Edit profile
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/wishlist">
                    <Heart className="h-4 w-4" />
                    Wishlist
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/">
                    <BookOpen className="h-4 w-4" />
                    My library
                  </Link>
                </Button>
                <form action={logoutAction}>
                  <Button variant="ghost" size="sm" type="submit">
                    <LogOut className="h-4 w-4" />
                    Log out
                  </Button>
                </form>
              </>
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

      {isOwner ? (
        <ProfileEditDialog
          user={user}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      ) : null}
    </>
  );
}
