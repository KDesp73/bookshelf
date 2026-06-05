import { BookGridSkeleton } from "@/components/loading/book-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfilePageSkeleton() {
  return (
    <div className="bookshelf-themed shelf-root space-y-5 rounded-2xl p-3 sm:space-y-6 sm:p-4">
      <div className="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700">
        <div className="px-4 pb-4 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
          <div className="flex flex-col items-center sm:flex-row sm:items-start">
            <Skeleton className="h-20 w-20 shrink-0 rounded-full sm:h-16 sm:w-16" />
            <div className="mt-4 flex w-full flex-1 flex-col items-center space-y-2 sm:ml-4 sm:mt-0 sm:items-start">
              <Skeleton className="h-7 w-44" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>

      <Skeleton className="h-10 w-full max-w-xs rounded-lg" />

      <div className="space-y-2">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-28" />
      </div>

      <BookGridSkeleton />
    </div>
  );
}
