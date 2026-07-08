"use client";

import Link from "next/link";
import { Store, BookHeart, BookOpen } from "lucide-react";
import type { RelevantStoreBook } from "@/types/store";

interface StoreRelevantBooksProps {
  books: RelevantStoreBook[];
}

export function StoreRelevantBooks({ books }: StoreRelevantBooksProps) {
  if (books.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-xl font-semibold text-amber-950 dark:text-amber-100">
          Available in stores
        </h2>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Books from your wishlist and favourite authors found in bookstores.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => (
          <div
            key={book._id}
            className="group rounded-xl border border-stone-200/80 bg-white/60 p-4 transition hover:shadow-md dark:border-stone-700 dark:bg-stone-900/40"
          >
            <div className="flex gap-4">
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="h-24 w-16 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-xs text-stone-400 dark:bg-stone-800">
                  No cover
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug text-stone-900 dark:text-stone-100">
                  {book.title}
                </p>
                <p className="mt-0.5 text-sm text-stone-500">{book.author}</p>

                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    &pound;{book.price.toFixed(2)}
                  </span>
                  {book.matchReason === "wishlist" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-950 dark:text-sky-200">
                      <BookHeart className="h-3 w-3" />
                      Wishlist match
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-950 dark:text-violet-200">
                      <BookOpen className="h-3 w-3" />
                      Author match
                    </span>
                  )}
                </div>

                <Link
                  href={`/u/${book.storeUsername}`}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-amber-700 hover:underline dark:text-amber-400"
                >
                  <Store className="h-3 w-3" />
                  {book.storeName}
                  {book.storeCity ? ` \u2014 ${book.storeCity}` : ""}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
