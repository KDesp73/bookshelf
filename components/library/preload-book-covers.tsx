"use client";

import { useEffect, useMemo } from "react";
import { preloadCoverUrls } from "@/lib/books/preload-covers";

interface PreloadBookCoversProps {
  books: { coverUrl?: string }[];
}

export function PreloadBookCovers({ books }: PreloadBookCoversProps) {
  const coverUrls = useMemo(
    () => [
      ...new Set(
        books.map((b) => b.coverUrl).filter((url): url is string => Boolean(url)),
      ),
    ],
    [books],
  );

  useEffect(() => {
    void preloadCoverUrls(coverUrls);
  }, [coverUrls]);

  return null;
}
