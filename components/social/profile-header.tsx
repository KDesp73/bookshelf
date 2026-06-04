"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Heart, KeyRound, LogOut, Palette, Pencil } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { toggleCollectionLikeAction } from "@/actions/social";
import type { CollectionLiker, UserProfile } from "@/types/user";
import { CollectionLikers } from "@/components/social/collection-likers";
import { ChangePasswordDialog } from "@/components/social/change-password-dialog";
import { ProfileEditDialog } from "@/components/social/profile-edit-dialog";
import { ShareProfileButton } from "@/components/social/share-profile-button";
import { ShelfAppearanceDialog } from "@/components/shelf/shelf-appearance-dialog";
import { UserAvatar } from "@/components/users/user-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  user: UserProfile;
  bookCount: number;
  likeCount: number;
  likers: CollectionLiker[];
  liked: boolean;
  isOwner: boolean;
  hasPassword?: boolean;
  viewerLoggedIn: boolean;
  wishlistPublic?: boolean;
}

export function ProfileHeader({
  user,
  bookCount,
  likeCount,
  likers,
  liked: initialLiked,
  isOwner,
  hasPassword = false,
  viewerLoggedIn,
  wishlistPublic = false,
}: ProfileHeaderProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(likeCount);
  const [editOpen, setEditOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const displayName = user.name ?? user.username ?? "Reader";

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
      <div className="shelf-header overflow-hidden rounded-xl border">
        <div className="bg-gradient-to-b from-amber-100/50 to-transparent px-4 pb-4 pt-5 dark:from-amber-950/20 sm:px-6 sm:pb-6 sm:pt-6">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
            <UserAvatar
              user={user}
              className="h-20 w-20 text-2xl ring-4 ring-white/80 dark:ring-stone-900/80 sm:h-16 sm:w-16 sm:text-xl sm:ring-0"
            />
            <div className="mt-4 min-w-0 flex-1 sm:ml-4 sm:mt-0">
              <h1 className="shelf-title font-serif text-2xl font-semibold text-amber-950 dark:text-amber-100">
                {displayName}
              </h1>
              {user.username ? (
                <p className="shelf-muted text-sm text-stone-500">@{user.username}</p>
              ) : null}
              {user.bio ? (
                <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-stone-700 dark:text-stone-300 sm:mx-0">
                  {user.bio}
                </p>
              ) : isOwner ? (
                <p className="mx-auto mt-2 max-w-xl text-sm text-stone-500 sm:mx-0">
                  Add a bio to tell people about your reading taste.
                </p>
              ) : null}
              <p className="shelf-stats mt-3 text-sm text-stone-600 dark:text-stone-400">
                <span className="font-medium text-stone-800 dark:text-stone-200">
                  {bookCount}
                </span>{" "}
                {bookCount === 1 ? "book" : "books"}
                <span className="mx-2 text-stone-300 dark:text-stone-600">·</span>
                <span className="font-medium text-stone-800 dark:text-stone-200">
                  {count}
                </span>{" "}
                {count === 1 ? "like" : "likes"}
              </p>
              <CollectionLikers likers={likers} totalCount={count} />
            </div>

            <div className="mt-4 hidden shrink-0 flex-wrap justify-end gap-2 sm:mt-0 sm:flex">
              <ShareProfileButton
                username={user.username!}
                displayName={displayName}
                bio={user.bio}
              />
              {renderDesktopActions()}
            </div>
          </div>
        </div>

        <div className="shelf-section border-t px-4 py-3 sm:hidden">
          <div className="grid grid-cols-2 gap-2">
            <ShareProfileButton
              username={user.username!}
              displayName={displayName}
              bio={user.bio}
              className="col-span-2 w-full justify-center"
              variant="default"
            />
            {renderMobileActions()}
          </div>
        </div>
      </div>

      {isOwner ? (
        <>
          <ProfileEditDialog
            user={user}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
          <ShelfAppearanceDialog
            user={user}
            open={appearanceOpen}
            onOpenChange={setAppearanceOpen}
          />
          {hasPassword ? (
            <ChangePasswordDialog
              open={passwordOpen}
              onOpenChange={setPasswordOpen}
            />
          ) : null}
        </>
      ) : null}
    </>
  );

  function renderDesktopActions() {
    if (isOwner) {
      return (
        <>
          <Button variant="outline" size="sm" onClick={() => setAppearanceOpen(true)}>
            <Palette className="h-4 w-4" />
            Customize shelf
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            Edit profile
          </Button>
          {hasPassword ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPasswordOpen(true)}
            >
              <KeyRound className="h-4 w-4" />
              Password
            </Button>
          ) : null}
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
      );
    }

    if (viewerLoggedIn) {
      return (
        <>
          {wishlistPublic && user.username ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/u/${user.username}/wishlist`}>
                <Heart className="h-4 w-4" />
                Wishlist
              </Link>
            </Button>
          ) : null}
          <Button
            variant={liked ? "default" : "outline"}
            size="sm"
            onClick={handleLike}
            disabled={pending}
          >
            <Heart className={cn("h-4 w-4", liked && "fill-current")} />
            {liked ? "Liked" : "Like collection"}
          </Button>
        </>
      );
    }

    return (
      <Button variant="outline" size="sm" asChild>
        <Link href={`/login?callbackUrl=/u/${user.username}`}>
          Sign in to like
        </Link>
      </Button>
    );
  }

  function renderMobileActions() {
    if (isOwner) {
      return (
        <>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-center"
            onClick={() => setAppearanceOpen(true)}
          >
            <Palette className="h-4 w-4" />
            Customize
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-center"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          {hasPassword ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center"
              onClick={() => setPasswordOpen(true)}
            >
              <KeyRound className="h-4 w-4" />
              Password
            </Button>
          ) : null}
          <Button variant="outline" size="sm" className="w-full justify-center" asChild>
            <Link href="/wishlist">
              <Heart className="h-4 w-4" />
              Wishlist
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-center" asChild>
            <Link href="/">
              <BookOpen className="h-4 w-4" />
              Library
            </Link>
          </Button>
          <form action={logoutAction} className="col-span-2">
            <Button variant="ghost" size="sm" type="submit" className="w-full justify-center">
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </form>
        </>
      );
    }

    if (viewerLoggedIn) {
      return (
        <>
          {wishlistPublic && user.username ? (
            <Button
              variant="outline"
              size="sm"
              className="col-span-2 w-full justify-center"
              asChild
            >
              <Link href={`/u/${user.username}/wishlist`}>
                <Heart className="h-4 w-4" />
                View wishlist
              </Link>
            </Button>
          ) : null}
          <Button
            variant={liked ? "default" : "outline"}
            size="sm"
            className="col-span-2 w-full justify-center"
            onClick={handleLike}
            disabled={pending}
          >
            <Heart className={cn("h-4 w-4", liked && "fill-current")} />
            {liked ? "Liked" : "Like collection"}
          </Button>
        </>
      );
    }

    return (
      <Button variant="outline" size="sm" className="col-span-2 w-full justify-center" asChild>
        <Link href={`/login?callbackUrl=/u/${user.username}`}>
          Sign in to like
        </Link>
      </Button>
    );
  }
}
