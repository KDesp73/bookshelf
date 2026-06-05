import { Skeleton } from "@/components/ui/skeleton";

interface SimplePageSkeletonProps {
  lines?: number;
}

export function SimplePageSkeleton({ lines = 4 }: SimplePageSkeletonProps) {
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
      <Skeleton className="h-10 w-32" />
    </div>
  );
}
