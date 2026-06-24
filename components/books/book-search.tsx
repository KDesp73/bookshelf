"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { searchBooksAction, lookupIsbnAction } from "@/actions/books";
import { saveBookAction, fetchCoverOptionsAction } from "@/actions/books";
import type { SearchResult } from "@/lib/books/search";
import type { BookInput } from "@/types/book";
import { BookCover } from "@/components/books/book-cover";
import { BookPreviewForm } from "@/components/books/book-preview-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { awardEasterEggAction } from "@/actions/easter-eggs";
import { preloadCoverUrls } from "@/lib/books/preload-covers";

type View = "search" | "preview" | "existing";

export function BookSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("search");
  const [preview, setPreview] = useState<BookInput | null>(null);
  const [existingTitle, setExistingTitle] = useState<string | null>(null);
  const [existingIsWishlist, setExistingIsWishlist] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSearch() {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    if (trimmed === "42") {
      awardEasterEggAction("easter_egg_42").then((result) => {
        if (result.success && result.data) {
          alert(`Easter egg found: ${result.data.name}!\n\n${result.data.description}`);
        }
      });
    }

    setError(null);
    setResults([]);
    startTransition(async () => {
      const result = await searchBooksAction(trimmed);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setResults(result.data);
      const coverUrls = result.data.map((r) => r.coverUrl).filter(Boolean) as string[];
      void preloadCoverUrls(coverUrls);
      if (result.data.length === 0) {
        setError("No books found. Try a different search.");
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  function handleSelect(result: SearchResult) {
    setError(null);
    setPreview(null);
    setView("search");

    startTransition(async () => {
      if (result.isbn13) {
        const res = await lookupIsbnAction(result.isbn13);
        if (!res.success) {
          setError(res.error);
          return;
        }

        if (res.data.type === "existing") {
          setExistingTitle(res.data.book.title);
          setExistingIsWishlist(res.data.book.isWishlist);
          setView("existing");
          return;
        }

        const previewData = res.data.preview;
        if (!previewData.coverUrl && result.coverUrl) {
          previewData.coverUrl = result.coverUrl;
        }

        setPreview(previewData);
        setView("preview");
        return;
      }

      const identifier = result.openLibraryWorkKey ?? result.googleVolumeId ?? `${result.title}-${result.authors.join(",")}`;

      setPreview({
        isbn13: identifier,
        title: result.title,
        subtitle: result.subtitle ?? undefined,
        authors: result.authors,
        coverUrl: result.coverUrl ?? undefined,
        publisher: result.publisher ?? undefined,
        publishedDate: result.publishYear?.toString(),
        description: result.description ?? undefined,
        pageCount: result.pageCount ?? undefined,
        openLibraryWorkKey: result.openLibraryWorkKey ?? undefined,
        googleVolumeId: result.googleVolumeId ?? undefined,
        status: "Unread",
        tags: [],
      });
      setView("preview");
    });
  }

  if (view === "preview" && preview) {
    return (
      <div className="space-y-4">
        <h2 className="text-center font-serif text-xl font-semibold">
          Confirm & save
        </h2>
        <BookPreviewForm initial={preview} />
        <div className="text-center">
          <Button variant="ghost" onClick={() => { setView("search"); setPreview(null); }}>
            Back to search
          </Button>
        </div>
      </div>
    );
  }

  if (view === "existing") {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950/30">
        <CheckCircle2 className="mx-auto h-10 w-10 text-amber-700 dark:text-amber-400" />
        <h2 className="font-serif text-lg font-semibold">
          {existingIsWishlist ? "Already in wishlist" : "Already in library"}
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          <strong>{existingTitle}</strong> is already on your{" "}
          {existingIsWishlist ? "wishlist" : "shelf"}.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => { setView("search"); setExistingTitle(null); }}>
            Search again
          </Button>
          <Button variant="outline" asChild>
            <Link href={existingIsWishlist ? "/wishlist" : "/"}>
              {existingIsWishlist ? "View wishlist" : "View library"}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by title, author, or keyword…"
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} disabled={pending || query.trim().length < 2}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      {error && (
        <p className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {pending && results.length === 0 && !error && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
        </div>
      )}

      {!pending && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>
          <div className="grid gap-3">
            {results.map((result, i) => (
              <button
                key={result.isbn13 ?? `${result.title}-${i}`}
                onClick={() => handleSelect(result)}
                className="flex gap-4 rounded-lg border border-stone-200 bg-white p-3 text-left shadow-sm transition-colors hover:border-stone-300 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700 dark:hover:bg-stone-800/80"
              >
                <BookCover
                  title={result.title}
                  coverUrl={result.coverUrl ?? undefined}
                  className="w-14 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-stone-900 dark:text-stone-100">
                    {result.title}
                  </h3>
                  {result.subtitle && (
                    <p className="truncate text-sm text-stone-500 dark:text-stone-400">
                      {result.subtitle}
                    </p>
                  )}
                  <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-300">
                    {result.authors?.join(", ") || "Unknown author"}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-stone-500 dark:text-stone-400">
                    {result.publishYear && <span>{result.publishYear}</span>}
                    {result.pageCount && <span>{result.pageCount} pages</span>}
                    <span className="capitalize">{result.source}</span>
                    {result.publisher && (
                      <span className="truncate">{result.publisher}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!pending && results.length === 0 && !error && query.trim().length >= 2 && (
        <div className="flex flex-col items-center gap-2 py-12 text-stone-500 dark:text-stone-400">
          <BookOpen className="h-8 w-8" />
          <p>No results yet. Try a different search term.</p>
        </div>
      )}
    </div>
  );
}
