"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  addToWishlistAction,
  deleteBookAction,
  moveToLibraryAction,
  moveToWishlistAction,
} from "@/actions/books";
import type { BookDocument, PublicBookDocument } from "@/types/book";
import { BookCover } from "@/components/books/book-cover";
import { StarRating } from "@/components/books/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FavoriteToggleButton } from "@/components/social/profile-favorites";
import { ShareBookButton } from "@/components/social/share-book-button";
import { cn } from "@/lib/utils";

interface BookDetailsDialogProps {
  book: (BookDocument | PublicBookDocument) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOwner: boolean;
  showNotes?: boolean;
  canAddToWishlist?: boolean;
  favoriteBookIds?: string[];
  canManageFavorites?: boolean;
  onUpdated?: (book: BookDocument) => void;
}

const statusColors: Record<string, string> = {
  Unread: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  Reading: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  Read: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  Wishlist: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
};

export function BookDetailsDialog({
  book,
  open,
  onOpenChange,
  isOwner,
  showNotes = isOwner,
  canAddToWishlist = false,
  favoriteBookIds = [],
  canManageFavorites = false,
  onUpdated,
}: BookDetailsDialogProps) {
  if (!book) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-4xl">
        <BookDetailsContent
          key={book._id}
          book={book}
          isOwner={isOwner}
          showNotes={showNotes}
          canAddToWishlist={canAddToWishlist}
          favoriteBookIds={favoriteBookIds}
          canManageFavorites={canManageFavorites}
          onOpenChange={onOpenChange}
          onUpdated={onUpdated}
        />
      </DialogContent>
    </Dialog>
  );
}

function BookDetailsContent({
  book,
  isOwner,
  showNotes,
  canAddToWishlist,
  favoriteBookIds,
  canManageFavorites,
  onOpenChange,
  onUpdated,
}: {
  book: BookDocument | PublicBookDocument;
  isOwner: boolean;
  showNotes: boolean;
  canAddToWishlist: boolean;
  favoriteBookIds: string[];
  canManageFavorites: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: (book: BookDocument) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [addedToWishlist, setAddedToWishlist] = useState(false);
  const isWishlist = book.isWishlist === true;

  function handleDelete() {
    const location = isWishlist ? "wishlist" : "library";
    if (!confirm(`Remove "${book.title}" from your ${location}?`)) return;

    startTransition(async () => {
      const result = await deleteBookAction(book._id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  function handleAddToWishlist() {
    setError(null);
    startTransition(async () => {
      const result = await addToWishlistAction({
        isbn13: book.isbn13,
        title: book.title,
        subtitle: book.subtitle,
        authors: book.authors,
        publisher: book.publisher,
        publishedDate: book.publishedDate,
        description: book.description,
        pageCount: book.pageCount,
        coverUrl: book.coverUrl,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setAddedToWishlist(true);
      router.refresh();
    });
  }

  function handleMoveToLibrary() {
    setError(null);
    startTransition(async () => {
      const result = await moveToLibraryAction(book._id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onUpdated?.(result.data);
      onOpenChange(false);
      router.refresh();
    });
  }

  function handleMoveToWishlist() {
    setError(null);
    startTransition(async () => {
      const result = await moveToWishlistAction(book._id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onUpdated?.(result.data);
      onOpenChange(false);
      router.refresh();
    });
  }

  const canShowNotes = showNotes || book.isPublicNote;

  return (
    <div>
      <div className="grid sm:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        <div className="relative flex items-center justify-center border-b border-stone-200/80 bg-gradient-to-br from-stone-100 via-white to-amber-50 p-6 sm:border-b-0 sm:border-r sm:p-8 dark:border-stone-800 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
          <BookCover
            title={book.title}
            coverUrl={book.coverUrl}
            className="w-48 shadow-xl sm:w-full sm:max-w-[230px]"
          />
        </div>

        <div className="min-w-0 space-y-5 p-6 pr-12 sm:p-7 sm:pr-12">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="font-serif text-2xl leading-tight sm:text-[1.75rem]">
              {book.title}
            </DialogTitle>
            {book.subtitle && (
              <p className="text-base leading-snug text-stone-600 dark:text-stone-400">
                {book.subtitle}
              </p>
            )}
            <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
              {book.authors.join(", ")}
            </p>
            {book.rating != null && !isWishlist ? (
              <div className="pt-0.5">
                <StarRating value={book.rating} readOnly />
              </div>
            ) : null}
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={cn(
                "border-0",
                statusColors[isWishlist ? "Wishlist" : book.status],
              )}
            >
              {isWishlist ? "Wishlist" : book.status}
            </Badge>
            {book.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          <dl className="grid grid-cols-2 gap-x-5 gap-y-3 rounded-lg border border-stone-200/80 bg-stone-50/70 px-4 py-3.5 dark:border-stone-800 dark:bg-stone-900/50">
            {book.publisher && (
              <div className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  Publisher
                </dt>
                <dd className="mt-0.5 truncate text-sm text-stone-800 dark:text-stone-200">
                  {book.publisher}
                </dd>
              </div>
            )}
            {book.publishedDate && (
              <div className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  Published
                </dt>
                <dd className="mt-0.5 text-sm text-stone-800 dark:text-stone-200">
                  {book.publishedDate}
                </dd>
              </div>
            )}
            {book.pageCount != null && (
              <div className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  Pages
                </dt>
                <dd className="mt-0.5 text-sm text-stone-800 dark:text-stone-200">
                  {book.pageCount}
                </dd>
              </div>
            )}
            <div className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
                ISBN
              </dt>
              <dd className="mt-0.5 truncate font-mono text-xs text-stone-800 dark:text-stone-200">
                {book.isbn13}
              </dd>
            </div>
          </dl>

          {book.description && (
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
                About this book
              </h3>
              <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                {book.description}
              </p>
            </section>
          )}

          {canShowNotes && book.notes && (
            <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-amber-900/70 dark:text-amber-200/70">
                  Notes
                </p>
                {book.isPublicNote && (
                  <span className="text-[10px] text-amber-600/60 dark:text-amber-400/60">
                    Public
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm text-stone-700 dark:text-stone-300">
                {book.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 border-t border-stone-200/80 bg-stone-50/95 px-6 py-4 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
        {error && (
          <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {canAddToWishlist ? (
            addedToWishlist ? (
              <Button variant="secondary" disabled>
                In your wishlist
              </Button>
            ) : (
              <Button onClick={handleAddToWishlist} disabled={pending}>
                {pending ? "Adding…" : "Add to wishlist"}
              </Button>
            )
          ) : null}
          {isOwner && isWishlist ? (
            <Button onClick={handleMoveToLibrary} disabled={pending}>
              {pending ? "Moving…" : "Move to library"}
            </Button>
          ) : null}
          {isOwner && !isWishlist && canManageFavorites ? (
            <FavoriteToggleButton
              bookId={book._id}
              isFavorite={favoriteBookIds.includes(book._id)}
              canManage
              variant="button"
            />
          ) : null}
          {isOwner && !isWishlist ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMoveToWishlist}
              disabled={pending}
            >
              {pending ? "Moving…" : "Move to wishlist"}
            </Button>
          ) : null}
          <ShareBookButton
            bookId={book._id}
            title={book.title}
            authors={book.authors}
          />
          {isOwner && (
            <Button asChild variant="outline" size="sm" className="sm:ml-auto">
              <Link
                href={`/books/${book._id}/edit`}
                onClick={() => onOpenChange(false)}
              >
                Edit
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
