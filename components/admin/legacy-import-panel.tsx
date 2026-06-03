"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimLegacyCollectionAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";

interface LegacyImportPanelProps {
  pendingCount: number;
  legacyUserIds: string[];
}

export function LegacyImportPanel({
  pendingCount,
  legacyUserIds,
}: LegacyImportPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleImport() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await claimLegacyCollectionAction();
      if (!result.success) {
        setError(result.error);
        return;
      }

      const { claimed, skipped, pending: remaining } = result.data;
      if (claimed === 0 && remaining === 0) {
        setMessage("No legacy books found to import.");
      } else {
        setMessage(
          `Imported ${claimed} book${claimed === 1 ? "" : "s"}` +
            (skipped > 0 ? ` (${skipped} skipped as duplicates)` : "") +
            (remaining > 0 ? `. ${remaining} still pending.` : "."),
        );
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-stone-200/80 bg-white/60 p-6 dark:border-stone-700 dark:bg-stone-900/40">
      <h2 className="font-serif text-lg font-semibold">Legacy collection</h2>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
        Import books from the original single-user library (
        {legacyUserIds.join(", ")}) into your admin account.
      </p>
      <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
        {pendingCount} legacy book{pendingCount === 1 ? "" : "s"} waiting to
        import.
      </p>
      <Button className="mt-4" onClick={handleImport} disabled={pending}>
        {pending ? "Importing…" : "Import legacy collection"}
      </Button>
      {message ? (
        <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
