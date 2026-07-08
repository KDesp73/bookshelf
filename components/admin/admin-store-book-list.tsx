"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteAdminStoreBookAction } from "@/actions/admin";
import type { StoreBookDocument } from "@/types/store";
import { Button } from "@/components/ui/button";

interface AdminStoreBookListProps {
  books: StoreBookDocument[];
}

export function AdminStoreBookList({
  books,
}: AdminStoreBookListProps) {
  if (books.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 px-6 py-12 text-center text-sm text-stone-500 dark:border-stone-600">
        No inventory books.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {books.map((book) => (
        <AdminStoreBookRow key={book._id} book={book} />
      ))}
    </div>
  );
}

function AdminStoreBookRow({
  book,
}: {
  book: StoreBookDocument;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!confirm(`Remove "${book.title}" from inventory?`)) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteAdminStoreBookAction(book._id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-stone-200/80 bg-white/60 p-3 dark:border-stone-700 dark:bg-stone-900/40">
      {book.coverImage ? (
        <img
          src={book.coverImage}
          alt={book.title}
          className="h-14 w-10 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded bg-stone-100 text-xs text-stone-400 dark:bg-stone-800">
          No cover
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-stone-900 dark:text-stone-100">
          {book.title}
        </p>
        <p className="text-sm text-stone-500">{book.author}</p>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-stone-500">
          {book.isbn ? <span>{book.isbn}</span> : null}
          <span>&pound;{book.price.toFixed(2)}</span>
          <span>Qty: {book.quantity}</span>
        </div>
        {error ? (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
        ) : null}
      </div>
      <Button
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={handleDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
