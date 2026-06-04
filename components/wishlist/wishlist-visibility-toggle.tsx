"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, Lock } from "lucide-react";
import { updateWishlistVisibilityAction } from "@/actions/wishlist";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WishlistVisibilityToggleProps {
  wishlistPublic: boolean;
}

export function WishlistVisibilityToggle({
  wishlistPublic: initialPublic,
}: WishlistVisibilityToggleProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [error, setError] = useState<string | null>(null);

  function setVisibility(nextPublic: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await updateWishlistVisibilityAction(nextPublic);
      if (!result.success) {
        setError(result.error ?? "Could not update visibility.");
        return;
      }
      setIsPublic(result.data.wishlistPublic);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50/80 p-4 dark:border-stone-700 dark:bg-stone-900/40">
      <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
        Wishlist visibility
      </p>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
        {isPublic
          ? "Others can view your wishlist on your public profile."
          : "Your wishlist is private — only you can see it."}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={isPublic ? "default" : "outline"}
          disabled={pending || isPublic}
          onClick={() => setVisibility(true)}
          className={cn(isPublic && "pointer-events-none")}
        >
          <Globe className="h-4 w-4" />
          Public
        </Button>
        <Button
          type="button"
          size="sm"
          variant={!isPublic ? "default" : "outline"}
          disabled={pending || !isPublic}
          onClick={() => setVisibility(false)}
          className={cn(!isPublic && "pointer-events-none")}
        >
          <Lock className="h-4 w-4" />
          Private
        </Button>
      </div>

      {error ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
