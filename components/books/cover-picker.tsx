"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { Link2 } from "lucide-react";
import { fetchCoverOptionsAction } from "@/actions/books";
import type { CoverOption } from "@/lib/books/covers";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CoverPickerProps {
  title: string;
  authors: string[];
  isbn13?: string;
  initialCoverUrl?: string;
  selectedUrl: string;
  onSelect: (url: string) => void;
  className?: string;
}

export function CoverPicker({
  title,
  authors,
  isbn13,
  initialCoverUrl,
  selectedUrl,
  onSelect,
  className,
}: CoverPickerProps) {
  const inputId = useId();
  const [options, setOptions] = useState<CoverOption[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [customMode, setCustomMode] = useState(false);
  const userEditedCustom = useRef(false);

  const canSearch = Boolean(title.trim() && authors.length > 0);

  const authorsKey = useMemo(() => JSON.stringify(authors), [authors]);

  useEffect(() => {
    if (!canSearch) {
      setOptions([]);
      return;
    }

    startTransition(async () => {
      setLoadError(null);
      const result = await fetchCoverOptionsAction({
        title,
        authors,
        isbn13,
        initialCoverUrl,
      });

      if (!result.success) {
        setLoadError(result.error);
        setOptions([]);
        return;
      }

      setOptions(result.data);

      if (
        !userEditedCustom.current &&
        !customMode &&
        !selectedUrl &&
        !initialCoverUrl &&
        result.data[0]?.url
      ) {
        onSelect(result.data[0].url);
      }
    });
  }, [title, authorsKey, isbn13, initialCoverUrl, canSearch]);

  const usingCustomUrl =
    customMode ||
    (selectedUrl.length > 0 && !options.some((o) => o.url === selectedUrl));

  function handleCustomChange(value: string) {
    userEditedCustom.current = true;
    setCustomMode(true);
    onSelect(value);
  }

  function handlePickEdition(url: string) {
    setCustomMode(false);
    userEditedCustom.current = false;
    onSelect(url);
  }

  return (
    <div className={cn("grid gap-4", className)}>
      <div className="rounded-lg border border-stone-200/80 bg-white/50 p-4 dark:border-stone-700 dark:bg-stone-900/30">
        <Label htmlFor={inputId}>Custom cover URL</Label>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          Paste any image link — you can use this instead of or alongside the
          edition covers below.
        </p>
        <Input
          id={inputId}
          className="mt-2"
          value={selectedUrl}
          onChange={(e) => handleCustomChange(e.target.value)}
          placeholder="https://…"
        />
        {usingCustomUrl && selectedUrl ? (
          <p className="mt-2 text-xs text-stone-500">Using your custom URL.</p>
        ) : null}
      </div>

      {canSearch ? (
        <div className="grid gap-3">
          <div>
            <Label>Edition covers</Label>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Different editions often have different art. Pick one that matches
              your copy.
            </p>
          </div>

          {pending && options.length === 0 ? (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {Array.from({ length: 8 }).map((_, i) => (
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

          {!pending && options.length === 0 && !loadError ? (
            <p className="text-sm text-stone-500">
              No edition covers found — use a custom URL above.
            </p>
          ) : null}

          {options.length > 0 ? (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              <button
                type="button"
                onClick={() => {
                  setCustomMode(true);
                  userEditedCustom.current = true;
                  if (!selectedUrl) onSelect("");
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-md border border-dashed p-2 text-center transition",
                  usingCustomUrl && !options.some((o) => o.url === selectedUrl)
                    ? "border-amber-600 bg-amber-50 ring-2 ring-amber-600 ring-offset-2 ring-offset-background dark:border-amber-500 dark:bg-amber-950/30 dark:ring-amber-500"
                    : "border-stone-300 hover:border-amber-400 dark:border-stone-600",
                )}
              >
                <span className="flex aspect-[2/3] w-full items-center justify-center rounded-md bg-stone-100 dark:bg-stone-800">
                  <Link2 className="h-6 w-6 text-stone-500" />
                </span>
                <span className="text-[10px] leading-tight text-stone-500">
                  Custom URL
                </span>
              </button>

              {options.map((option) => {
                const selected =
                  !usingCustomUrl && selectedUrl === option.url;
                return (
                  <button
                    key={option.url}
                    type="button"
                    onClick={() => handlePickEdition(option.url)}
                    className={cn(
                      "group flex flex-col gap-1 rounded-md text-left transition",
                      selected
                        ? "ring-2 ring-amber-600 ring-offset-2 ring-offset-background dark:ring-amber-500"
                        : "ring-1 ring-stone-200 hover:ring-amber-400 dark:ring-stone-700",
                    )}
                    title={[option.source, option.label]
                      .filter(Boolean)
                      .join(" — ")}
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
      ) : (
        <p className="text-xs text-stone-500">
          Enter a title and author to search for edition covers, or use a custom
          URL above.
        </p>
      )}
    </div>
  );
}
