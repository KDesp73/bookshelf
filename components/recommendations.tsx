import { getDailyRecommendations } from "@/lib/recommendations/engine";
import { RecommendationCard } from "@/components/recommendations/recommendation-card";
import type { RecommendationItem } from "@/types/recommendation";

interface RecommendationsProps {
  userId: string;
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
