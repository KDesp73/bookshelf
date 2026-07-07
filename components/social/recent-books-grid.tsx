"use client";

import { useState } from "react";
import Link from "next/link";
import type { BookDocument, DiscoverBook } from "@/types/book";
import { BookCover } from "@/components/books/book-cover";
import { BookDetailsDialog } from "@/components/library/book-details-dialog";
import { PreloadBookCovers } from "@/components/library/preload-book-covers";

interface RecentBooksGridProps {
  books: DiscoverBook[];
}

export function RecentBooksGrid({ books }: RecentBooksGridProps) {
  const [selected, setSelected] = useState<DiscoverBook | null>(null);

  if (books.length === 0) return null;

  return (
    <>
      <PreloadBookCovers books={books} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {books.map((book) => (
          <div
            key={book._id}
            className="group rounded-xl border border-stone-200/80 bg-white/50 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-stone-700 dark:bg-stone-900/30"
          >
            <div
              role="button"
              tabIndex={0}
              aria-label={`View ${book.title}`}
              onClick={() => setSelected(book)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelected(book);
                }
              }}
              className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/50 rounded-md"
            >
              <BookCover
                title={book.title}
                coverUrl={book.coverUrl}
                className="mx-auto w-full max-w-28 transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-lg"
              />
            </div>
            <div className="mt-3 space-y-1">
              <p className="line-clamp-2 text-sm font-medium text-stone-900 dark:text-stone-100">
                {book.title}
              </p>
              {book.authors.length > 0 ? (
                <p className="line-clamp-1 text-xs text-stone-500 dark:text-stone-400">
                  {book.authors.join(", ")}
                </p>
              ) : null}
              <Link
                href={`/u/${book.username}`}
                className="block pt-1 text-xs font-medium text-amber-700 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
              >
                {book.userDisplayName ?? book.username}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <BookDetailsDialog
        book={selected as BookDocument | null}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        isOwner={false}
        canAddToWishlist
      />
    </>
  );
}
