import Link from "next/link";
import { BookCover } from "@/components/books/book-cover";
import { getDailyRecommendations } from "@/lib/recommendations/engine";
import type { RecommendationItem } from "@/types/recommendation";

interface RecommendationsProps {
  userId: string;
}

function RecommendationCard({ item }: { item: RecommendationItem }) {
  return (
    <div className="group relative rounded-xl border border-stone-200/70 bg-white/60 p-3 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-stone-300/80 hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.08)] dark:border-stone-700/60 dark:bg-stone-900/30 dark:hover:border-stone-600/60 dark:hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.3)]">
      <div className="relative mx-auto w-full max-w-24">
        <BookCover
          title={item.title}
          coverUrl={item.coverUrl}
          className="w-full rounded-md shadow-[0_2px_4px_rgba(0,0,0,0.08)] ring-1 ring-stone-900/5 transition-shadow duration-200 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] dark:ring-white/5"
        />
      </div>
      <div className="mt-3 space-y-1.5">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-stone-900 dark:text-stone-100">
          {item.title}
        </p>
        {item.authors.length > 0 && (
          <p className="line-clamp-1 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
            {item.authors.join(", ")}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200/50 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-700/30">
            {item.reason}
          </span>
          {item.fromUsername && (
            <Link
              href={`/u/${item.fromUsername}`}
              className="inline-flex items-center gap-0.5 text-[11px] font-medium text-stone-400 transition-colors hover:text-amber-600 dark:text-stone-500 dark:hover:text-amber-400"
            >
              <svg className="size-3" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 15.75-1.5-1.5m0 0-1.5-1.5m1.5 1.5h-6m6 0-1.5 1.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              {item.fromUserDisplayName ?? item.fromUsername}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export async function Recommendations({ userId }: RecommendationsProps) {
  let items: RecommendationItem[] = [];

  try {
    items = await getDailyRecommendations(userId);
  } catch {
    return null;
  }

  if (items.length === 0) return null;

  return (
    <section className="rounded-xl border border-stone-200/70 bg-white/50 p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] dark:border-stone-700/50 dark:bg-stone-900/30">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Recommended for you
          </h2>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            Based on what you and similar readers enjoy
          </p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {items.map((item, i) => (
          <RecommendationCard
            key={`${item.isbn13 ?? item.title}-${i}`}
            item={item}
          />
        ))}
      </div>
    </section>
  );
}
