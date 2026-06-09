import Image from "next/image";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookCoverProps {
  title: string;
  coverUrl?: string;
  className?: string;
  /** Load immediately (above-the-fold grid items). */
  priority?: boolean;
}

export function BookCover({
  title,
  coverUrl,
  className,
  priority = false,
}: BookCoverProps) {
  if (coverUrl) {
    return (
      <div
        className={cn(
          "relative aspect-[2/3] overflow-hidden rounded-md bg-stone-200 shadow-md ring-1 ring-stone-900/10 dark:bg-stone-800",
          className,
        )}
      >
        <Image
          src={coverUrl}
          alt={`Cover of ${title}`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
          priority={priority}
          referrerPolicy="no-referrer"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex aspect-[2/3] items-center justify-center rounded-md bg-gradient-to-br from-amber-100 to-stone-200 text-amber-900 shadow-md ring-1 ring-stone-900/10 dark:from-amber-950 dark:to-stone-800 dark:text-amber-200",
        className,
      )}
    >
      <BookOpen className="h-10 w-10 opacity-60" />
    </div>
  );
}
