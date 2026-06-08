import Link from "next/link";
import { BookCover } from "@/components/books/book-cover";
import type { DiscoverBook } from "@/types/book";

interface BookCardProps {
  book: DiscoverBook;
}

export function BookCard({ book }: BookCardProps) {
  return (
    <div className="group rounded-xl border border-stone-200/80 bg-white/50 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-stone-700 dark:bg-stone-900/30">
      <BookCover
        title={book.title}
        coverUrl={book.coverUrl}
        className="mx-auto w-full max-w-28"
      />
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
  );
}
