import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-stone-200 dark:bg-stone-800",
        className,
      )}
      aria-hidden
      {...props}
    />
  );
}

export { Skeleton };
