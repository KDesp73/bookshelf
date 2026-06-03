"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteBookAsAdminAction } from "@/actions/admin";
import type { BookDocument } from "@/types/book";
import { BookCover } from "@/components/books/book-cover";
import { StarRating } from "@/components/books/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminBookListProps {
  books: BookDocument[];
  userId: string;
}

const statusColors: Record<string, string> = {
  Unread: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  Reading: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  Read: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
};

export function AdminBookList({ books, userId }: AdminBookListProps) {
  if (books.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 px-6 py-12 text-center text-sm text-stone-500 dark:border-stone-600">
        No books in this collection.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {books.map((book) => (
        <AdminBookRow key={book._id} book={book} userId={userId} />
      ))}
    </div>
  );
}

function AdminBookRow({
  book,
  userId,
}: {
  book: BookDocument;
  userId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!confirm(`Remove "${book.title}" from this collection?`)) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteBookAsAdminAction(book._id, userId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-start gap-4 rounded-xl border border-stone-200/80 bg-white/60 p-4 dark:border-stone-700 dark:bg-stone-900/40">
      <BookCover title={book.title} coverUrl={book.coverUrl} className="w-16 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-stone-900 dark:text-stone-100">{book.title}</p>
        <p className="text-sm text-stone-500">{book.authors.join(", ")}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge className={cn("border-0", statusColors[book.status])}>
            {book.status}
          </Badge>
          {book.rating != null ? (
            <StarRating value={book.rating} readOnly size="sm" />
          ) : null}
          <span className="font-mono text-xs text-stone-400">{book.isbn13}</span>
        </div>
        {book.notes ? (
          <p className="mt-2 line-clamp-2 text-xs text-stone-500">
            Notes: {book.notes}
          </p>
        ) : null}
        {error ? (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
        ) : null}
      </div>
      <Button
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={handleDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Remove
      </Button>
    </div>
  );
}
