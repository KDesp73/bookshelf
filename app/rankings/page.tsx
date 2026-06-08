import { Suspense } from "react";
import { RankingsList } from "@/components/social/rankings-list";

export default function RankingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-amber-950 dark:text-amber-100 sm:text-3xl">
          Rankings
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Top readers ranked by books added, books read, likes, and achievements.
        </p>
      </div>

      <Suspense fallback={<div className="h-10 animate-pulse rounded-md bg-stone-200 dark:bg-stone-800" />}>
        <RankingsList />
      </Suspense>
    </div>
  );
}
