export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-6 py-4">
      <div className="space-y-2">
        <div className="h-8 w-32 rounded bg-stone-200 dark:bg-stone-800" />
        <div className="h-4 w-64 rounded bg-stone-200 dark:bg-stone-800" />
      </div>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-stone-200/80 bg-white/60 p-6 dark:border-stone-700 dark:bg-stone-900/40"
        >
          <div className="mb-4 h-6 w-40 rounded bg-stone-200 dark:bg-stone-800" />
          <div className="h-32 rounded bg-stone-200 dark:bg-stone-800" />
        </div>
      ))}
    </div>
  );
}
