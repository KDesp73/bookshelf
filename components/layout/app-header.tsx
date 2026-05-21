import Link from "next/link";
import { BookOpen, LogIn, LogOut, Plus, ScanLine } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { isAdmin } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";

export async function AppHeader() {
  const admin = await isAdmin();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#f6f1ea]/90 backdrop-blur-md dark:border-stone-700 dark:bg-stone-950/90">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-serif text-lg font-semibold text-amber-950 dark:text-amber-100"
        >
          <BookOpen className="h-5 w-5 text-amber-800" />
          BookShelf
        </Link>
        <nav className="flex items-center gap-2">
          {admin ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/add">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add</span>
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/scan">
                  <ScanLine className="h-4 w-4" />
                  <span className="hidden sm:inline">Scan</span>
                </Link>
              </Button>
              <form action={logoutAction}>
                <Button variant="ghost" size="sm" type="submit">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Log out</span>
                </Button>
              </form>
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
