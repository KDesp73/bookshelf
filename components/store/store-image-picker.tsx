"use client";

import { useId, useRef, useState, useTransition } from "react";
import { Link2, Upload, Search } from "lucide-react";
import { fetchStoreCoverOptionsAction } from "@/actions/store-covers";
import type { CoverOption } from "@/lib/books/covers";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface StoreImagePickerProps {
  value: string;
  onChange: (url: string) => void;
  /** When used for a book, pass title/author/isbn for cover search. */
  bookTitle?: string;
  bookAuthor?: string;
  bookIsbn?: string;
  /** Show the cover search tab (default false). */
  showSearch?: boolean;
  /** Label for the image field. */
  label?: string;
  /** Whether the image is required. */
  required?: boolean;
  className?: string;
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 2 * 1024 * 1024;

export function StoreImagePicker({
  value,
  onChange,
  bookTitle,
  bookAuthor,
  bookIsbn,
  showSearch = false,
  label = "Image",
  required = false,
  className,
}: StoreImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"url" | "upload" | "search">(
    value.startsWith("data:") ? "upload" : "url",
  );
  const [urlValue, setUrlValue] = useState(
    value && !value.startsWith("data:") ? value : "",
  );
  const [uploadPreview, setUploadPreview] = useState(
    value.startsWith("data:") ? value : "",
  );
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [covers, setCovers] = useState<CoverOption[]>([]);
  const [coverSearchTitle, setCoverSearchTitle] = useState(bookTitle ?? "");
  const [coverSearchAuthor, setCoverSearchAuthor] = useState(bookAuthor ?? "");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canSearch = Boolean(
    (bookTitle || coverSearchTitle).trim() &&
    (bookAuthor || coverSearchAuthor).trim(),
  );

  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setUrlValue(val);
    setActiveTab("url");
    onChange(val);
  }

  function handleFileUpload(file: File | null) {
    setUploadError(null);

    if (!file) {
      setUploadPreview("");
      onChange(urlValue);
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setUploadError("Use a JPEG, PNG, WebP, or GIF image.");
      return;
    }

    if (file.size > MAX_BYTES) {
      setUploadError("Image must be 2 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      setUploadPreview(dataUri);
      setActiveTab("upload");
      onChange(dataUri);
    };
    reader.readAsDataURL(file);
  }

  function handleSearch() {
    const title = (bookTitle || coverSearchTitle).trim();
    const author = (bookAuthor || coverSearchAuthor).trim();
    if (!title || !author) return;

    startTransition(async () => {
      setLoadError(null);
      const result = await fetchStoreCoverOptionsAction({
        title,
        authors: [author],
        isbn13: bookIsbn?.trim(),
      });

      if (!result.success) {
        setLoadError(result.error);
        setCovers([]);
        return;
      }

      setCovers(result.data);
      setActiveTab("search");
    });
  }

  function handleSelectCover(url: string) {
    onChange(url);
    setUrlValue(url);
    setUploadPreview("");
    setActiveTab("url");
  }

  function handleClear() {
    onChange("");
    setUrlValue("");
    setUploadPreview("");
    setCovers([]);
    setActiveTab("url");
  }

  const hasBookMetadata = Boolean(bookTitle && bookAuthor);

  return (
    <div className={cn("grid gap-3", className)}>
      <div className="flex items-center justify-between">
        <Label>
          {label}
          {!required ? (
            <span className="text-xs text-stone-500"> (optional)</span>
          ) : null}
        </Label>
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-red-600 underline-offset-2 hover:underline dark:text-red-400"
          >
            Remove
          </button>
        ) : null}
      </div>

      <div className="flex gap-1 rounded-lg border border-stone-200 p-1 dark:border-stone-700">
        <button
          type="button"
          onClick={() => setActiveTab("url")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
            activeTab === "url"
              ? "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100"
              : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200",
          )}
        >
          <Link2 className="h-3.5 w-3.5" />
          URL
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
            activeTab === "upload"
              ? "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100"
              : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200",
          )}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload
        </button>
        {showSearch ? (
          <button
            type="button"
            onClick={() => setActiveTab("search")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
              activeTab === "search"
                ? "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100"
                : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200",
            )}
          >
            <Search className="h-3.5 w-3.5" />
            Search
          </button>
        ) : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files?.[0] ?? null)}
      />

      {activeTab === "url" ? (
        <Input
          placeholder="https://example.com/image.jpg"
          value={urlValue}
          onChange={handleUrlChange}
        />
      ) : null}

      {activeTab === "upload" ? (
        <div className="space-y-2">
          {uploadPreview ? (
            <div className="relative aspect-[2/3] max-w-40 overflow-hidden rounded-md border border-stone-200 bg-stone-100 dark:border-stone-700 dark:bg-stone-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadPreview}
                alt="Upload preview"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stone-300 p-6 text-center transition hover:border-amber-400 dark:border-stone-600"
            >
              <Upload className="h-8 w-8 text-stone-400" />
              <span className="text-sm text-stone-500">
                Click to upload an image
              </span>
              <span className="text-xs text-stone-400">
                JPEG, PNG, WebP, or GIF (max 2 MB)
              </span>
            </div>
          )}
          {uploadError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
          ) : null}
        </div>
      ) : null}

      {activeTab === "search" && showSearch ? (
        <div className="space-y-3">
          {!hasBookMetadata ? (
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Title"
                  value={coverSearchTitle}
                  onChange={(e) => setCoverSearchTitle(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Author"
                  value={coverSearchAuthor}
                  onChange={(e) => setCoverSearchAuthor(e.target.value)}
                />
              </div>
            </div>
          ) : null}

          <Button
            type="button"
            size="sm"
            onClick={handleSearch}
            disabled={!canSearch || pending}
          >
            {pending ? "Searching\u2026" : "Search covers"}
          </Button>

          {pending ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[2/3] animate-pulse rounded-md bg-stone-200 dark:bg-stone-800"
                />
              ))}
            </div>
          ) : null}

          {loadError ? (
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {loadError}
            </p>
          ) : null}

          {!pending && covers.length === 0 && !loadError ? (
            <p className="text-sm text-stone-500">
              {hasBookMetadata
                ? "Click \"Search covers\" to find edition artwork."
                : "Enter a title and author, then search."}
            </p>
          ) : null}

          {covers.length > 0 ? (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {covers.map((option) => {
                const selected = value === option.url;
                return (
                  <button
                    key={option.url}
                    type="button"
                    onClick={() => handleSelectCover(option.url)}
                    className={cn(
                      "group flex flex-col gap-1 rounded-md text-left transition",
                      selected
                        ? "ring-2 ring-amber-600 ring-offset-2 ring-offset-background dark:ring-amber-500"
                        : "ring-1 ring-stone-200 hover:ring-amber-400 dark:ring-stone-700",
                    )}
                    title={[option.source, option.label]
                      .filter(Boolean)
                      .join(" \u2014 ")}
                  >
                    <span className="relative block aspect-[2/3] overflow-hidden rounded-md bg-stone-200 dark:bg-stone-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={option.url}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </span>
                    {(option.label || option.source) && (
                      <span className="line-clamp-2 text-[10px] leading-tight text-stone-500 group-hover:text-stone-700 dark:group-hover:text-stone-300">
                        {option.label ?? option.source}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      {value && activeTab !== "upload" && (
        <div className="relative aspect-[2/3] max-w-40 overflow-hidden rounded-md border border-stone-200 bg-stone-100 dark:border-stone-700 dark:bg-stone-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Preview"
            className="h-full w-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
