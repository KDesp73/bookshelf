"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveBookAction } from "@/actions/books";
import { normalizeIsbn } from "@/lib/books/isbn";
import { READING_STATUSES } from "@/lib/constants";
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
import { CoverPicker } from "@/components/books/cover-picker";

interface ManualEntryFormProps {
  initialIsbn?: string;
}

export function ManualEntryForm({ initialIsbn = "" }: ManualEntryFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  const [isbn, setIsbn] = useState(initialIsbn);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [publisher, setPublisher] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [status, setStatus] = useState<(typeof READING_STATUSES)[number]>("Unread");
  const [tagsInput, setTagsInput] = useState("");
  const [notes, setNotes] = useState("");

  function goToStep2() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!authors.trim()) {
      setError("At least one author is required.");
      return;
    }
    setError(null);
    setStep(2);
  }

  function handleSubmit(isWishlist: boolean) {
    setError(null);
    const normalized = isbn.trim() ? normalizeIsbn(isbn) : null;
    const isbn13 = normalized ?? `manual-${Date.now()}`;

    startTransition(async () => {
      const result = await saveBookAction({
        isbn13,
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        authors: authors.split(",").map((a) => a.trim()).filter(Boolean),
        publisher: publisher.trim() || undefined,
        coverUrl: coverUrl.trim() || undefined,
        status: isWishlist ? "Unread" : status,
        tags: tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        notes: notes.trim() || undefined,
        isWishlist,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(isWishlist ? "/wishlist" : "/");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="flex gap-2 text-sm text-stone-500">
        <span className={step === 1 ? "font-medium text-amber-900 dark:text-amber-200" : ""}>
          1. Book details
        </span>
        <span>→</span>
        <span className={step === 2 ? "font-medium text-amber-900 dark:text-amber-200" : ""}>
          2. Organization
        </span>
      </div>

      {step === 1 ? (
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="isbn">ISBN (optional)</Label>
            <Input
              id="isbn"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="9780143127550"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
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
            <Label htmlFor="authors">Authors * (comma-separated)</Label>
            <Input
              id="authors"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              placeholder="Jane Doe, John Smith"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="publisher">Publisher</Label>
            <Input
              id="publisher"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
            />
          </div>
          <CoverPicker
            title={title.trim()}
            authors={authors
              .split(",")
              .map((a) => a.trim())
              .filter(Boolean)}
            isbn13={isbn.trim() ? (normalizeIsbn(isbn) ?? undefined) : undefined}
            selectedUrl={coverUrl}
            onSelect={setCoverUrl}
          />
          <Button onClick={goToStep2}>Continue</Button>
        </div>
      ) : (
        <div className="grid gap-4">
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
            <Label>Tags</Label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Indie, Signed"
            />
          </div>
          <div className="grid gap-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => handleSubmit(false)} disabled={pending}>
              {pending ? "Saving…" : "Save to Library"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleSubmit(true)}
              disabled={pending}
            >
              Add to Wishlist
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
