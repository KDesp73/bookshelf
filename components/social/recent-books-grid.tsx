"use client";

import { useState } from "react";
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
        {books.map((book, index) => (
          <div
            key={book._id}
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
            className="group shelf-card relative cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/50 rounded-md"
          >
            <BookCover
              title={book.title}
              coverUrl={book.coverUrl}
              priority={index < 12}
              className="w-full transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-lg"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-md bg-gradient-to-t from-black/80 via-black/50 to-transparent p-2 pt-8 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:opacity-0">
              <p className="line-clamp-2 text-xs font-medium text-white">
                {book.title}
              </p>
              <p className="line-clamp-1 text-[10px] text-stone-300">
                {book.authors.join(", ")}
              </p>
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
