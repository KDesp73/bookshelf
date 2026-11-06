import Link from "next/link";
import { Compass, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const bookSpines = [
  { height: "h-24", width: "w-4", color: "bg-stone-500 dark:bg-stone-600" },
  { height: "h-20", width: "w-5", color: "bg-amber-800 dark:bg-amber-700" },
  { height: "h-28", width: "w-4", color: "bg-amber-600 dark:bg-amber-600" },
  { height: "h-24", width: "w-6", color: "bg-stone-700 dark:bg-stone-500" },
];

export default function NotFound() {
  return (
    <div className="relative isolate flex min-h-[70vh] items-center justify-center overflow-hidden py-12 sm:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200/50 blur-3xl dark:bg-amber-900/20"
      />

      <div className="w-full max-w-xl text-center">
        <div aria-hidden className="select-none">
          <p className="font-serif text-7xl font-semibold tracking-tight text-amber-950/90 dark:text-amber-50/90 sm:text-8xl">
            404
          </p>

          <div className="mx-auto mt-8 max-w-xs">
            <div className="flex items-end justify-center gap-1.5">
              {bookSpines.map((book, index) => (
                <div
                  key={index}
                  className={`relative ${book.height} ${book.width} ${book.color} rounded-sm shadow-sm`}
                >
                  <span className="absolute inset-x-1 top-2 h-px bg-amber-100/50" />
                  <span className="absolute inset-x-1 bottom-2 h-px bg-amber-100/30" />
                </div>
              ))}

              <div className="h-24 w-9 rounded-sm border-2 border-dashed border-amber-700/30 dark:border-amber-300/25" />

              <div className="relative -ml-1 h-24 w-5 origin-bottom -rotate-12 rounded-sm bg-amber-700 shadow-md dark:bg-amber-600">
                <span className="absolute inset-x-1 top-2 h-px bg-amber-200/60" />
                <span className="absolute inset-x-1 bottom-2 h-px bg-amber-200/60" />
              </div>
            </div>
            <div className="mt-1 h-2 rounded-full bg-stone-300 dark:bg-stone-700" />
            <div className="mx-auto h-1.5 w-[85%] rounded-b-lg bg-stone-200 dark:bg-stone-800" />
          </div>
        </div>

        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.25em] text-amber-800 dark:text-amber-300">
          Page not found
        </p>

        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-amber-950 dark:text-amber-50 sm:text-4xl">
          This page isn&apos;t on our shelf.
        </h1>

        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-stone-600 dark:text-stone-400">
          The book you&apos;re looking for may have been moved, checked out, or
          never catalogued. Let&apos;s get you back to familiar shelves.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
              Back home
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/discover">
              <Compass className="h-4 w-4" />
              Browse collections
            </Link>
          </Button>
        </div>

        <Link
          href="/search"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 underline-offset-4 hover:underline dark:text-amber-300"
        >
          <Search className="h-4 w-4" />
          Or search for a book
        </Link>
      </div>
    </div>
  );
}
