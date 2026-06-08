export default function RankingsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-9 w-48 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
        <div className="mt-2 h-5 w-96 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
      </div>
      <div className="h-10 w-64 animate-pulse rounded-md bg-stone-200 dark:bg-stone-800" />
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg bg-stone-100 dark:bg-stone-800"
          />
        ))}
      </div>
    </div>
  );
}
