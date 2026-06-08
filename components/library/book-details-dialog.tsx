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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
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
    <>
      <DialogHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <DialogTitle className="font-serif pr-2 text-xl leading-snug">
          {book.title}
        </DialogTitle>
        {isOwner && (
          <Link
            href={`/books/${book._id}/edit`}
            onClick={() => onOpenChange(false)}
          >
            <Button variant="outline" size="sm" className="shrink-0">
              Edit
            </Button>
          </Link>
        )}
      </DialogHeader>

      <div className="space-y-5">
        <div className="flex flex-col gap-5 sm:flex-row">
          <BookCover
            title={book.title}
            coverUrl={book.coverUrl}
            className="mx-auto w-40 sm:mx-0 sm:w-36"
          />
          <div className="min-w-0 flex-1 space-y-3">
            {book.subtitle && (
              <p className="text-base text-stone-600 dark:text-stone-400">
                {book.subtitle}
              </p>
            )}
            <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
              {book.authors.join(", ")}
            </p>
            {book.rating != null && !isWishlist ? (
              <StarRating value={book.rating} readOnly />
            ) : null}
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
            <dl className="grid gap-1 text-sm text-stone-600 dark:text-stone-400">
              {book.publisher && (
                <div>
                  <dt className="inline font-medium text-stone-700 dark:text-stone-300">
                    Publisher:{" "}
                  </dt>
                  <dd className="inline">{book.publisher}</dd>
                </div>
              )}
              {book.publishedDate && (
                <div>
                  <dt className="inline font-medium text-stone-700 dark:text-stone-300">
                    Published:{" "}
                  </dt>
                  <dd className="inline">{book.publishedDate}</dd>
                </div>
              )}
              {book.pageCount != null && (
                <div>
                  <dt className="inline font-medium text-stone-700 dark:text-stone-300">
                    Pages:{" "}
                  </dt>
                  <dd className="inline">{book.pageCount}</dd>
                </div>
              )}
              <div>
                <dt className="inline font-medium text-stone-700 dark:text-stone-300">
                  ISBN:{" "}
                </dt>
                <dd className="inline font-mono text-xs">{book.isbn13}</dd>
              </div>
            </dl>
          </div>
        </div>

        {book.description && (
          <div className="rounded-lg border border-stone-200/80 bg-white/60 px-4 py-3 dark:border-stone-700 dark:bg-stone-900/40">
            <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
              {book.description}
            </p>
          </div>
        )}

        {canShowNotes && book.notes && (
          <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-900/70 dark:text-amber-200/70">
                Notes
              </p>
              {book.isPublicNote && (
                <span className="text-[10px] text-amber-600/60 dark:text-amber-400/60">
                  Public
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">
              {book.notes}
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex flex-wrap gap-2">
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
        </div>
      </div>
    </>
  );
}
