"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  backfillBookMetadataAction,
  getBooksNeedingMetadataCountAction,
} from "@/actions/admin";
import { Button } from "@/components/ui/button";

interface MetadataEnrichmentPanelProps {
  pendingCount: number;
}

export function MetadataEnrichmentPanel({
  pendingCount: initialCount,
}: MetadataEnrichmentPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pendingCount, setPendingCount] = useState(initialCount);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleEnrich() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await backfillBookMetadataAction();
      if (!result.success) {
        setError(result.error);
        return;
      }

      const { processed, updated, skipped, failed } = result.data;
      setMessage(
        `Processed ${processed} books: ${updated} updated, ${skipped} skipped, ${failed} failed.`,
      );

      const countResult = await getBooksNeedingMetadataCountAction();
      if (countResult.success) {
        setPendingCount(countResult.data.count);
      }

      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-stone-200/80 bg-white/60 p-6 dark:border-stone-700 dark:bg-stone-900/40">
      <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
        Book metadata enrichment
      </h2>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
        Fetches genres, subjects, categories, language, and publication year from
        Open Library and Google Books for existing titles with real ISBNs. New
        books are enriched automatically when scanned or looked up.
      </p>
      <p className="mt-2 text-sm text-stone-500">
        {pendingCount === 0
          ? "All enrichable books are up to date (or use manual ISBNs)."
          : `${pendingCount} book${pendingCount === 1 ? "" : "s"} can still be enriched.`}
      </p>

      {message ? (
        <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <Button
        className="mt-4"
        onClick={handleEnrich}
        disabled={pending || pendingCount === 0}
      >
        {pending ? "Enriching…" : "Enrich up to 500 books"}
      </Button>
    </div>
  );
}
