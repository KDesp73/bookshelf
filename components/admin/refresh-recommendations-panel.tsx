"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refreshRecommendationsAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";

export function RefreshRecommendationsPanel() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleRefresh() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await refreshRecommendationsAction();
      if (!result.success) {
        setError(result.error);
        return;
      }

      setMessage(
        `Cleared ${result.data.deletedCount} recommendation set${result.data.deletedCount === 1 ? "" : "s"}. New recommendations will be generated on next visit.`,
      );
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-stone-200/80 bg-white/60 p-6 dark:border-stone-700 dark:bg-stone-900/40">
      <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
        Recommendations
      </h2>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
        Clears all cached recommendations. Fresh recommendations will be
        generated for each user the next time they visit the homepage.
      </p>

      {message ? (
        <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <Button
        className="mt-4"
        onClick={handleRefresh}
        disabled={pending}
      >
        {pending ? "Refreshing…" : "Refresh all recommendations"}
      </Button>
    </div>
  );
}
