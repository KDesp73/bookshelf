export default function NewsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-32 rounded bg-stone-200 dark:bg-stone-800" />
        <div className="h-4 w-64 rounded bg-stone-200 dark:bg-stone-800" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-stone-200/80 bg-white/60 p-6 dark:border-stone-700 dark:bg-stone-900/40"
          >
            <div className="h-6 w-2/3 rounded bg-stone-200 dark:bg-stone-800" />
            <div className="mt-3 h-4 w-full rounded bg-stone-200 dark:bg-stone-800" />
            <div className="mt-2 h-3 w-40 rounded bg-stone-200 dark:bg-stone-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
