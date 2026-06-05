import { SimplePageSkeleton } from "@/components/loading/simple-page-skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <SimplePageSkeleton lines={2} />
      <div className="mx-auto aspect-square max-w-md animate-pulse rounded-xl bg-stone-200 dark:bg-stone-800" />
    </div>
  );
}
