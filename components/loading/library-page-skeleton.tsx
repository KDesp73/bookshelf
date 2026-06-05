import { BookGridSkeleton } from "@/components/loading/book-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

interface LibraryPageSkeletonProps {
  titleWidth?: string;
}

export function LibraryPageSkeleton({
  titleWidth = "w-40",
}: LibraryPageSkeletonProps) {
  return (
    <div className="bookshelf-themed shelf-root space-y-6 rounded-2xl p-3 sm:p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className={`h-8 ${titleWidth} sm:h-9`} />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-28" />
      </div>

      <BookGridSkeleton />
    </div>
  );
}
