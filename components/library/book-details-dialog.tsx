"use client";

import { useEffect, useState, useTransition } from "react";
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

interface BookDetailsDialogProps {
  book: BookDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationSuggestions: string[];
  onUpdated: (book: BookDocument) => void;
}

export function BookDetailsDialog({
  book,
  open,
  onOpenChange,
  locationSuggestions,
  onUpdated,
}: BookDetailsDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(book?.status ?? "Unread");
  const [physicalLocation, setPhysicalLocation] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!book) return;
    setStatus(book.status);
    setPhysicalLocation(book.physicalLocation ?? "");
    setTagsInput(book.tags.join(", "));
    setNotes(book.notes ?? "");
    setError(null);
  }, [book]);

  if (!book) return null;

  const currentBook = book;

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateBookAction(currentBook._id, {
        status,
        physicalLocation: physicalLocation || undefined,
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
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm(`Remove "${currentBook.title}" from your library?`)) return;

    startTransition(async () => {
      const result = await deleteBookAction(currentBook._id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-serif pr-8">{currentBook.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 sm:flex-row">
          <BookCover
            title={currentBook.title}
            coverUrl={currentBook.coverUrl}
            className="mx-auto w-36 sm:mx-0"
          />
          <div className="min-w-0 flex-1 space-y-2 text-sm">
            {currentBook.subtitle && (
              <p className="text-stone-600 dark:text-stone-400">{currentBook.subtitle}</p>
            )}
            <p>{currentBook.authors.join(", ")}</p>
            {currentBook.publisher && <p className="text-stone-500">{currentBook.publisher}</p>}
            <p className="font-mono text-xs text-stone-500">ISBN: {currentBook.isbn13}</p>
            {currentBook.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {currentBook.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {currentBook.description && (
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {currentBook.description}
          </p>
        )}

        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
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
            <Label>Location</Label>
            <Input
              list="dialog-location-suggestions"
              value={physicalLocation}
              onChange={(e) => setPhysicalLocation(e.target.value)}
            />
            <datalist id="dialog-location-suggestions">
              {locationSuggestions.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
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
            variant="destructive"
            onClick={handleDelete}
            disabled={pending}
          >
            Remove
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
