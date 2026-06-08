import { Quote } from "lucide-react";
import { getDailyQuote } from "@/lib/quotes";

export async function DailyQuote() {
  const quote = await getDailyQuote();

  if (!quote) return null;

  return (
    <div className="rounded-xl border border-stone-200/80 bg-white/60 p-5 dark:border-stone-700 dark:bg-stone-900/40">
      <div className="flex gap-3">
        <Quote className="mt-1 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm leading-relaxed text-stone-700 italic dark:text-stone-300">
            &ldquo;{quote.text}&rdquo;
          </p>
          <p className="mt-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
            — {quote.author}
          </p>
        </div>
      </div>
    </div>
  );
}
