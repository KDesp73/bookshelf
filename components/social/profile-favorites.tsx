"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import type { PublicBookDocument } from "@/types/book";
import { BookCover } from "@/components/books/book-cover";
import { BookDetailsDialog } from "@/components/library/book-details-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ProfileFavoritesProps {
  books: PublicBookDocument[];
  isOwner: boolean;
  favoriteBookIds: string[];
}

export function ProfileFavorites({
  books,
  isOwner,
  favoriteBookIds,
}: ProfileFavoritesProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<PublicBookDocument | null>(null);

  if (books.length === 0 && !isOwner) {
    return null;
  }

  return (
    <section className="shelf-section rounded-xl border p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
        <h2 className="shelf-title font-serif text-lg font-semibold">Favorites</h2>
      </div>

      {books.length === 0 ? (
        <p className="shelf-muted text-sm">
          Pin up to 5 books from your collection — open a book and tap the star.
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {books.map((book) => (
            <button
              key={book._id}
              type="button"
              onClick={() => setSelected(book)}
              className="group shelf-card w-24 shrink-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/50 sm:w-28"
            >
              <BookCover
                title={book.title}
                coverUrl={book.coverUrl}
                className="w-full transition-transform duration-200 group-hover:-translate-y-0.5"
              />
              <p className="mt-2 line-clamp-2 text-xs font-medium text-stone-800 dark:text-stone-200">
                {book.title}
              </p>
            </button>
          ))}
          {isOwner && books.length < 5
            ? Array.from({ length: 5 - books.length }, (_, index) => (
                <div
                  key={`empty-${index}`}
                  className="flex w-24 shrink-0 flex-col sm:w-28"
                  aria-hidden
                >
                  <div className="aspect-[2/3] rounded-md border border-dashed border-stone-300 dark:border-stone-600" />
                </div>
              ))
            : null}
        </div>
      )}

      <BookDetailsDialog
        book={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        isOwner={isOwner}
        showNotes={isOwner}
        favoriteBookIds={favoriteBookIds}
        canManageFavorites={isOwner}
        onUpdated={() => router.refresh()}
      />
    </section>
  );
}

interface FavoriteToggleButtonProps {
  bookId: string;
  isFavorite: boolean;
  canManage: boolean;
  className?: string;
  variant?: "icon" | "button";
  onToggled?: (isFavorite: boolean) => void;
}

export function FavoriteToggleButton({
  bookId,
  isFavorite,
  canManage,
  className,
  variant = "icon",
  onToggled,
}: FavoriteToggleButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [favorite, setFavorite] = useState(isFavorite);
  const [error, setError] = useState<string | null>(null);

  if (!canManage) return null;

  function handleToggle(event: React.MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const { toggleFavoriteBookAction } = await import("@/actions/favorites");
      const result = await toggleFavoriteBookAction(bookId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setFavorite(result.data.isFavorite);
      onToggled?.(result.data.isFavorite);
      router.refresh();
    });
  }

  return (
    <>
      {variant === "button" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={handleToggle}
          className={className}
        >
          <Star
            className={cn(
              "h-4 w-4",
              favorite ? "fill-amber-400 text-amber-400" : "",
            )}
          />
          {favorite ? "Remove from favorites" : "Add to favorites"}
        </Button>
      ) : (
        <button
          type="button"
          aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          title={favorite ? "Remove from favorites" : "Add to favorites"}
          disabled={pending}
          onClick={handleToggle}
          className={cn(
            "rounded-full bg-black/70 p-1 text-amber-300 transition-colors hover:bg-black/85 disabled:opacity-60",
            className,
          )}
        >
          <Star
            className={cn(
              "h-3.5 w-3.5",
              favorite ? "fill-amber-400 text-amber-400" : "text-stone-200",
            )}
          />
        </button>
      )}
      {error ? (
        <span className={variant === "button" ? "text-sm text-red-600 dark:text-red-400" : "sr-only"} role="status">
          {error}
        </span>
      ) : null}
    </>
  );
}
