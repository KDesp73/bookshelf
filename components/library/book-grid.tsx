"use client";

import { useState } from "react";
import type { BookDocument, PublicBookDocument } from "@/types/book";
import { BookCover } from "@/components/books/book-cover";
import { StarRating } from "@/components/books/star-rating";
import { Badge } from "@/components/ui/badge";
import { BookDetailsDialog } from "@/components/library/book-details-dialog";
import { PreloadBookCovers } from "@/components/library/preload-book-covers";
import { cn } from "@/lib/utils";

interface BookGridProps {
  books: (BookDocument | PublicBookDocument)[];
  isOwner: boolean;
  showNotes?: boolean;
  emptyMessage?: string;
  canAddToWishlist?: boolean;
}

const statusColors: Record<string, string> = {
  Unread: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  Reading: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  Read: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  Wishlist: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
};

export function BookGrid({
  books,
  isOwner,
  showNotes = isOwner,
  emptyMessage,
  canAddToWishlist = false,
}: BookGridProps) {
  const [selected, setSelected] = useState<BookDocument | PublicBookDocument | null>(
    null,
  );

  if (books.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 bg-white/50 px-6 py-16 text-center dark:border-stone-600 dark:bg-stone-900/30">
        <p className="font-serif text-lg text-stone-700 dark:text-stone-300">
          {emptyMessage ?? "Your shelf is empty"}
        </p>
        {isOwner ? (
          <p className="mt-2 text-sm text-stone-500">
            Scan a barcode or add a book manually to get started.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <PreloadBookCovers books={books} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {books.map((book, index) => (
          <button
            key={book._id}
            type="button"
            onClick={() => setSelected(book)}
            className="group relative text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/50 rounded-md"
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
            <Badge
              className={cn(
                "absolute left-1.5 top-1.5 border-0 text-[10px]",
                statusColors[book.isWishlist ? "Wishlist" : book.status],
              )}
            >
              {book.isWishlist ? "Wishlist" : book.status}
            </Badge>
            {book.rating != null && !book.isWishlist ? (
              <div className="absolute right-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5">
                <StarRating value={book.rating} readOnly size="sm" showValue={false} />
              </div>
            ) : null}
          </button>
        ))}
      </div>

      <BookDetailsDialog
        book={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        isOwner={isOwner}
        showNotes={showNotes}
        canAddToWishlist={canAddToWishlist}
        onUpdated={(updated) => setSelected(updated)}
      />
    </>
  );
}
