"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BookOpen, LogIn, Shield, Store, Users } from "lucide-react";
import { AddBookMenu } from "@/components/layout/add-book-menu";
import { HeaderProfileAvatar } from "@/components/layout/header-profile-avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useRef } from "react";
import { awardEasterEggAction } from "@/actions/easter-eggs";

export function AppHeader() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === "loading";
  const router = useRouter();
  const logoClickCount = useRef(0);

  useEffect(() => {
    if (user?.id) {
      router.prefetch("/community");
      if (user.username) {
        router.prefetch(`/u/${user.username}`);
      }
    } else if (!isLoading) {
      router.prefetch("/register");
      router.prefetch("/discover");
    }
  }, [user?.id, user?.username, isLoading, router]);

  const handleLogoClick = useCallback(() => {
    if (!user?.id) return;
    logoClickCount.current++;
    if (logoClickCount.current >= 10) {
      logoClickCount.current = 0;
      awardEasterEggAction("easter_egg_logo").then((result) => {
        if (result.success && result.data) {
          alert(`Easter egg found: ${result.data.name}!\n\n${result.data.description}`);
        }
      });
    }
  }, [user?.id]);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-background/90 backdrop-blur-md dark:border-stone-700">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          onClick={handleLogoClick}
          className="flex items-center gap-2 font-serif text-lg font-semibold text-amber-950 dark:text-amber-100"
        >
          <BookOpen className="h-5 w-5 text-amber-800" />
          BookShelf
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {!isLoading && !user ? <ThemeToggle /> : null}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/community">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Community</span>
            </Link>
          </Button>
          {user?.isStore ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/store/dashboard">
                <Store className="h-4 w-4" />
                <span className="hidden sm:inline">Store</span>
              </Link>
            </Button>
          ) : null}

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
              <>
                <AddBookMenu />
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                  <Link
                    href={user.username ? `/u/${user.username}` : "/settings"}
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
