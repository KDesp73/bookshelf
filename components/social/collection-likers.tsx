import Link from "next/link";
import type { CollectionLiker } from "@/types/user";
import { UserAvatar } from "@/components/users/user-avatar";
import { cn } from "@/lib/utils";

interface CollectionLikersProps {
  likers: CollectionLiker[];
  totalCount: number;
  className?: string;
}

function likerLabel(liker: CollectionLiker): string {
  return liker.name ?? (liker.username ? `@${liker.username}` : "Reader");
}

export function CollectionLikers({
  likers,
  totalCount,
  className,
}: CollectionLikersProps) {
  if (totalCount === 0) return null;

  const avatarLikers = likers.slice(0, 8);
  const nameLikers = likers.slice(0, 6);
  const hiddenCount = Math.max(0, totalCount - nameLikers.length);

  return (
    <div className={cn("mt-3", className)}>
      <p className="shelf-muted text-xs font-medium uppercase tracking-wide">
        Liked by
      </p>

      {avatarLikers.length > 0 ? (
        <div className="mt-2 flex items-center -space-x-2">
          {avatarLikers.map((liker) => {
            const avatar = (
              <UserAvatar
                user={liker}
                className="h-8 w-8 text-xs ring-2 ring-white dark:ring-stone-900"
              />
            );

            if (liker.username) {
              return (
                <Link
                  key={liker._id}
                  href={`/u/${liker.username}`}
                  className="relative transition hover:z-10 hover:scale-110"
                  title={likerLabel(liker)}
                >
                  {avatar}
                  <span className="sr-only">{likerLabel(liker)}</span>
                </Link>
              );
            }

            return (
              <span
                key={liker._id}
                className="relative"
                title={likerLabel(liker)}
              >
                {avatar}
              </span>
            );
          })}
        </div>
      ) : null}

      <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        {nameLikers.map((liker, index) => (
          <span key={liker._id}>
            {index > 0 ? ", " : null}
            {liker.username ? (
              <Link
                href={`/u/${liker.username}`}
                className="font-medium text-amber-900 hover:underline dark:text-amber-200"
              >
                {liker.name ?? `@${liker.username}`}
              </Link>
            ) : (
              <span className="font-medium text-stone-700 dark:text-stone-300">
                {likerLabel(liker)}
              </span>
            )}
          </span>
        ))}
        {hiddenCount > 0 ? (
          <span>
            {nameLikers.length > 0 ? ", and " : null}
            {hiddenCount} {hiddenCount === 1 ? "other" : "others"}
          </span>
        ) : null}
      </p>
    </div>
  );
}
