import Link from "next/link";
import { BookCover } from "@/components/books/book-cover";
import { getDailyRecommendations } from "@/lib/recommendations/engine";
import type { RecommendationItem } from "@/types/recommendation";

interface RecommendationsProps {
  userId: string;
}

function RecommendationCard({ item }: { item: RecommendationItem }) {
  return (
    <div className="group rounded-xl border border-stone-200/80 bg-white/50 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-stone-700 dark:bg-stone-900/30">
      <BookCover
        title={item.title}
        coverUrl={item.coverUrl}
        className="mx-auto w-full max-w-24"
      />
      <div className="mt-3 space-y-1">
        <p className="line-clamp-2 text-sm font-medium text-stone-900 dark:text-stone-100">
          {item.title}
        </p>
        {item.authors.length > 0 && (
          <p className="line-clamp-1 text-xs text-stone-500 dark:text-stone-400">
            {item.authors.join(", ")}
          </p>
        )}
        <div className="flex flex-wrap gap-1 pt-1">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            item.source === "community"
              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
              : "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200"
          }`}>
            {item.reason}
          </span>
        </div>
        {item.fromUsername && (
          <Link
            href={`/u/${item.fromUsername}`}
            className="block text-[11px] font-medium text-amber-700 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
          >
            from {item.fromUserDisplayName ?? item.fromUsername}
          </Link>
        )}
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
    <div className="rounded-xl border border-stone-200/80 bg-white/60 p-5 dark:border-stone-700 dark:bg-stone-900/40">
      <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
        Recommended for you
      </h2>
      <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
        Discover new books — updated daily
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((item, i) => (
          <RecommendationCard key={`${item.source}-${item.isbn13 ?? item.title}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}
