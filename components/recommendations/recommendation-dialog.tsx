"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToWishlistAction } from "@/actions/books";
import type { RecommendationItem } from "@/types/recommendation";
import { BookCover } from "@/components/books/book-cover";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RecommendationDialogProps {
  item: RecommendationItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecommendationDialog({
  item,
  open,
  onOpenChange,
}: RecommendationDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [addedToWishlist, setAddedToWishlist] = useState(false);

  function handleAddToWishlist() {
    setError(null);
    startTransition(async () => {
      const result = await addToWishlistAction({
        isbn13: item.isbn13 ?? "",
        title: item.title,
        authors: item.authors,
        coverUrl: item.coverUrl,
        description: item.description,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setAddedToWishlist(true);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl leading-snug">
            {item.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-col gap-5 sm:flex-row">
            <BookCover
              title={item.title}
              coverUrl={item.coverUrl}
              className="mx-auto w-40 sm:mx-0 sm:w-36"
            />
            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                {item.authors.join(", ")}
              </p>
              {item.isbn13 && (
                <p className="font-mono text-xs text-stone-500 dark:text-stone-400">
                  ISBN: {item.isbn13}
                </p>
              )}
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200/50 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-700/30">
                {item.reason}
              </span>
            </div>
          </div>

          {item.description && (
            <div className="rounded-lg border border-stone-200/80 bg-white/60 px-4 py-3 dark:border-stone-700 dark:bg-stone-900/40">
              <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                {item.description}
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {addedToWishlist ? (
              <Button variant="secondary" disabled>
                In your wishlist
              </Button>
            ) : (
              <Button onClick={handleAddToWishlist} disabled={pending}>
                {pending ? "Adding…" : "Add to wishlist"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
