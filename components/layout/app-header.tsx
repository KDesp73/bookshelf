"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { BookOpen, Compass, LogIn, Newspaper, Shield } from "lucide-react";
import { AddBookMenu } from "@/components/layout/add-book-menu";
import { HeaderProfileAvatar } from "@/components/layout/header-profile-avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === "loading";

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-background/90 backdrop-blur-md dark:border-stone-700">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-serif text-lg font-semibold text-amber-950 dark:text-amber-100"
        >
          <BookOpen className="h-5 w-5 text-amber-800" />
          BookShelf
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {!isLoading && !user ? <ThemeToggle /> : null}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/discover">
              <Compass className="h-4 w-4" />
              <span className="hidden sm:inline">Discover</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/news">
              <Newspaper className="h-4 w-4" />
              <span className="hidden sm:inline">News</span>
            </Link>
          </Button>

          {isLoading ? (
            <Skeleton className="h-8 w-8 rounded-full" />
          ) : user ? (
            <>
              {user.isAdmin ? (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                </Button>
              ) : null}
              {user.username ? (
                <>
                  <AddBookMenu />
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                    <Link
                      href={`/u/${user.username}`}
                      aria-label="Your profile"
                      title="Your profile"
                    >
                      <HeaderProfileAvatar
                        userId={user.id}
                        name={user.name}
                        username={user.username}
                        className="h-7 w-7 text-xs"
                      />
                    </Link>
                  </Button>
                </>
              ) : null}
            </>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Log in</span>
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
