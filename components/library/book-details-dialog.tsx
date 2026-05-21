"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteBookAction,
  updateBookAction,
} from "@/actions/books";
import type { BookDocument } from "@/types/book";
import { READING_STATUSES } from "@/lib/constants";
import { BookCover } from "@/components/books/book-cover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface BookDetailsDialogProps {
  book: BookDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  onUpdated: (book: BookDocument) => void;
}

const statusColors: Record<string, string> = {
  Unread: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  Reading: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  Read: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
};

export function BookDetailsDialog({
  book,
  open,
  onOpenChange,
  isAdmin,
  onUpdated,
}: BookDetailsDialogProps) {
  if (!book) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <BookDetailsContent
          key={book._id}
          book={book}
          isAdmin={isAdmin}
          onOpenChange={onOpenChange}
          onUpdated={onUpdated}
        />
      </DialogContent>
    </Dialog>
  );
}

function BookDetailsContent({
  book,
  isAdmin,
  onOpenChange,
  onUpdated,
}: {
  book: BookDocument;
  isAdmin: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (book: BookDocument) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(book.status);
  const [coverUrl, setCoverUrl] = useState(book.coverUrl ?? "");
  const [tagsInput, setTagsInput] = useState(book.tags.join(", "));
  const [notes, setNotes] = useState(book.notes ?? "");

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateBookAction(book._id, {
        status,
        coverUrl: coverUrl.trim() || undefined,
        tags: tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        notes: notes || undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      onUpdated(result.data);
      setEditing(false);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm(`Remove "${book.title}" from your library?`)) return;

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

  return (
    <>
      <DialogHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <DialogTitle className="font-serif pr-2 text-xl leading-snug">
          {book.title}
        </DialogTitle>
        {isAdmin && !editing && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
        )}
      </DialogHeader>

      {editing ? (
        <div className="space-y-4">
          <div className="flex gap-4">
            <BookCover
              title={book.title}
              coverUrl={coverUrl || book.coverUrl}
              className="w-28 shrink-0"
            />
            <p className="text-sm text-stone-500">
              Update the cover URL to change the image shown in your library.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>Cover image URL</Label>
              <Input
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as typeof status)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {READING_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Tags</Label>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditing(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={pending}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
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
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={cn(
                    "border-0",
                    statusColors[book.status],
                  )}
                >
                  {book.status}
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

          {book.notes && (
            <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-900/70 dark:text-amber-200/70">
                Notes
              </p>
              <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">
                {book.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
