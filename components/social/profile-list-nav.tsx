import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProfileListNavProps {
  username: string;
  active: "collection" | "wishlist";
  wishlistPublic: boolean;
  isOwner: boolean;
  wishlistCount?: number;
}

export function ProfileListNav({
  username,
  active,
  wishlistPublic,
  isOwner,
  wishlistCount,
}: ProfileListNavProps) {
  const showWishlist = isOwner || wishlistPublic;
  if (!showWishlist) return null;

  const collectionHref = `/u/${username}`;
  const wishlistHref = `/u/${username}/wishlist`;
  const wishlistLabel =
    typeof wishlistCount === "number"
      ? `Wishlist (${wishlistCount})`
      : "Wishlist";

  return (
    <nav
      className="flex gap-1 rounded-lg border border-stone-200 bg-stone-50/80 p-1 dark:border-stone-700 dark:bg-stone-900/40"
      aria-label="Profile lists"
    >
      <Link
        href={collectionHref}
        className={cn(
          "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          active === "collection"
            ? "bg-background text-foreground shadow-sm"
            : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100",
        )}
      >
        Collection
      </Link>
      <Link
        href={wishlistHref}
        className={cn(
          "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          active === "wishlist"
            ? "bg-background text-foreground shadow-sm"
            : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100",
        )}
      >
        {wishlistLabel}
        {isOwner && !wishlistPublic ? (
          <span className="ml-1 text-xs text-stone-500">(private)</span>
        ) : null}
      </Link>
    </nav>
  );
}
