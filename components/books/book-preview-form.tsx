"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveBookAction } from "@/actions/books";
import type { BookInput } from "@/types/book";
import { READING_STATUSES } from "@/lib/constants";
import { BookCover } from "@/components/books/book-cover";
import { Button } from "@/components/ui/button";
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

interface BookPreviewFormProps {
  initial: BookInput;
}

export function BookPreviewForm({ initial }: BookPreviewFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState(initial.coverUrl ?? "");
  const [tagsInput, setTagsInput] = useState(initial.tags?.join(", ") ?? "");
  const [status, setStatus] = useState(initial.status ?? "Unread");
  const [notes, setNotes] = useState(initial.notes ?? "");

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveBookAction({
        ...initial,
        coverUrl: coverUrl.trim() || undefined,
        status,
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

      router.push("/");
      router.refresh();
    });
  }

  const authors = initial.authors?.join(", ") ?? "Unknown";

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div className="flex gap-4">
        <BookCover
          title={initial.title}
          coverUrl={coverUrl || initial.coverUrl}
          className="w-28 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100">
            {initial.title}
          </h2>
          {initial.subtitle && (
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {initial.subtitle}
            </p>
          )}
          <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">
            {authors}
          </p>
          <p className="mt-2 font-mono text-xs text-stone-500">
            ISBN-13: {initial.isbn13}
          </p>
        </div>
      </div>

      {initial.description && (
        <p className="line-clamp-4 text-sm text-stone-600 dark:text-stone-400">
          {initial.description}
        </p>
      )}

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="cover">Cover image URL</Label>
          <Input
            id="cover"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="status">Reading status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger id="status">
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
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Sci-Fi, Hardcover"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes…"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <Button onClick={handleSave} disabled={pending} size="lg">
        {pending ? "Saving…" : "Save to Library"}
      </Button>
    </div>
  );
}
