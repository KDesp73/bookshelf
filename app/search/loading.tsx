export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <div className="h-7 w-48 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
      <div className="mt-1 h-5 w-80 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
      <div className="flex gap-2">
        <div className="h-10 flex-1 animate-pulse rounded-md bg-stone-200 dark:bg-stone-800" />
        <div className="h-10 w-20 animate-pulse rounded-md bg-stone-200 dark:bg-stone-800" />
      </div>
    </div>
  );
}
