"use client";

import { Euro } from "lucide-react";
import type { StoreBookDocument } from "@/types/store";
import { BookCover } from "@/components/books/book-cover";

interface StoreBookGridProps {
  books: StoreBookDocument[];
}

export function StoreBookGrid({ books }: StoreBookGridProps) {
  if (books.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {books.map((book) => (
          <div key={book._id} className="group relative">
            <BookCover
              title={book.title}
              coverUrl={book.coverImage}
              className="w-full transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-lg"
            />
            <div className="mt-1.5 space-y-0.5">
              <p className="line-clamp-1 text-xs font-medium text-stone-800 dark:text-stone-200">
                {book.title}
              </p>
              <p className="line-clamp-1 text-[11px] text-stone-500">
                {book.author}
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  <Euro className="h-3 w-3" />
                  {book.price.toFixed(2)}
                </span>
                <span className="text-[10px] text-stone-400">
                  Qty: {book.quantity}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
