import { Skeleton } from "@/components/ui/skeleton";

interface BookGridSkeletonProps {
  count?: number;
}

export function BookGridSkeleton({ count = 12 }: BookGridSkeletonProps) {
  return (
    <div className="shelf-grid grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton
          key={index}
          className="aspect-[2/3] w-full rounded-md"
        />
      ))}
    </div>
  );
}
