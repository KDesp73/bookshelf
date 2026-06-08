"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteBookAction,
  moveToLibraryAction,
  moveToWishlistAction,
  updateBookAction,
} from "@/actions/books";
import type { BookDocument } from "@/types/book";
import { READING_STATUSES } from "@/lib/constants";
import { BookCover } from "@/components/books/book-cover";
import { CoverPicker } from "@/components/books/cover-picker";
import { StarRating } from "@/components/books/star-rating";
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

interface BookEditFormProps {
  book: BookDocument;
}

export function BookEditForm({ book }: BookEditFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(book.title);
  const [subtitle, setSubtitle] = useState(book.subtitle ?? "");
  const [authorsInput, setAuthorsInput] = useState(book.authors.join(", "));
  const [publisher, setPublisher] = useState(book.publisher ?? "");
  const [publishedDate, setPublishedDate] = useState(book.publishedDate ?? "");
  const [description, setDescription] = useState(book.description ?? "");
  const [pageCount, setPageCount] = useState(book.pageCount?.toString() ?? "");
  const [coverUrl, setCoverUrl] = useState(book.coverUrl ?? "");
  const [genresInput, setGenresInput] = useState(
    (book.genres ?? []).join(", "),
  );
  const [subjectsInput, setSubjectsInput] = useState(
    (book.subjects ?? []).join(", "),
  );
  const [categoriesInput, setCategoriesInput] = useState(
    (book.categories ?? []).join(", "),
  );
  const [language, setLanguage] = useState(book.language ?? "");
  const [status, setStatus] = useState(book.status);
  const [tagsInput, setTagsInput] = useState(book.tags.join(", "));
  const [notes, setNotes] = useState(book.notes ?? "");
  const [isPublicNote, setIsPublicNote] = useState(book.isPublicNote);
  const [rating, setRating] = useState<number | undefined>(book.rating);

  const isWishlist = book.isWishlist === true;

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateBookAction(book._id, {
        title: title.trim() || undefined,
        subtitle: subtitle.trim() || undefined,
        authors: authorsInput
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        publisher: publisher.trim() || undefined,
        publishedDate: publishedDate.trim() || undefined,
        description: description.trim() || undefined,
        pageCount: pageCount ? Number(pageCount) : undefined,
        coverUrl: coverUrl.trim() || undefined,
        genres: genresInput
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean),
        subjects: subjectsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        categories: categoriesInput
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        language: language.trim() || undefined,
        ...(isWishlist
          ? {}
          : {
              status,
              rating: rating ?? null,
            }),
        tags: tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        notes: notes || undefined,
        isPublicNote,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push("/");
      router.refresh();
    });
  }

  function handleDelete() {
    const location = isWishlist ? "wishlist" : "library";
    if (!confirm(`Remove "${book.title}" from your ${location}?`)) return;

    startTransition(async () => {
      const result = await deleteBookAction(book._id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push("/");
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
      router.push("/");
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
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <BookCover
          title={title || book.title}
          coverUrl={coverUrl || book.coverUrl}
          className="w-28 shrink-0"
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="authors">Authors (comma-separated)</Label>
            <Input
              id="authors"
              value={authorsInput}
              onChange={(e) => setAuthorsInput(e.target.value)}
            />
          </div>
        </div>
      </div>

      <CoverPicker
        title={title || book.title}
        authors={
          authorsInput
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean)
        }
        isbn13={book.isbn13.startsWith("manual-") ? undefined : book.isbn13}
        initialCoverUrl={book.coverUrl}
        selectedUrl={coverUrl}
        onSelect={setCoverUrl}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="publisher">Publisher</Label>
          <Input
            id="publisher"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="publishedDate">Published date</Label>
          <Input
            id="publishedDate"
            value={publishedDate}
            onChange={(e) => setPublishedDate(e.target.value)}
            placeholder="e.g. 2024 or 2024-05-12"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pageCount">Page count</Label>
          <Input
            id="pageCount"
            type="number"
            min="0"
            value={pageCount}
            onChange={(e) => setPageCount(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="language">Language</Label>
          <Input
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="en, fr, el…"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="genres">Genres (comma-separated)</Label>
          <Input
            id="genres"
            value={genresInput}
            onChange={(e) => setGenresInput(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="subjects">Subjects (comma-separated)</Label>
          <Input
            id="subjects"
            value={subjectsInput}
            onChange={(e) => setSubjectsInput(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="categories">Categories (comma-separated)</Label>
          <Input
            id="categories"
            value={categoriesInput}
            onChange={(e) => setCategoriesInput(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="isbn">ISBN</Label>
        <Input id="isbn" value={book.isbn13} readOnly className="bg-stone-100 dark:bg-stone-800" />
        <p className="text-xs text-stone-500">ISBN cannot be changed.</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {!isWishlist ? (
          <div className="grid gap-2">
            <Label>Rating</Label>
            <StarRating value={rating} onChange={setRating} />
          </div>
        ) : null}

        {!isWishlist ? (
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as typeof status)}
            >
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
        ) : null}
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
          rows={3}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublicNote}
            onChange={(e) => setIsPublicNote(e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 text-amber-700 focus:ring-amber-500 dark:border-stone-600"
          />
          <span className="text-stone-700 dark:text-stone-300">
            Make this note public
          </span>
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex flex-wrap gap-2 border-t border-stone-200 pt-4 dark:border-stone-700">
        <Button onClick={handleSave} disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={pending}
        >
          Cancel
        </Button>
        {isWishlist ? (
          <Button
            variant="secondary"
            onClick={handleMoveToLibrary}
            disabled={pending}
          >
            Move to library
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={handleMoveToWishlist}
            disabled={pending}
          >
            Move to wishlist
          </Button>
        )}
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={pending}
          className="ml-auto"
        >
          Remove
        </Button>
      </div>
    </div>
  );
}
