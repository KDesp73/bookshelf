"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShareProfileButtonProps {
  username: string;
  displayName: string;
  bio?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
}

export function ShareProfileButton({
  username,
  displayName,
  bio,
  className,
  variant = "outline",
}: ShareProfileButtonProps) {
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleShare() {
    setPending(true);
    setCopied(false);

    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/u/${username}`
        : `/u/${username}`;
    const title = `${displayName} on BookShelf`;
    const text =
      bio?.trim() ||
      `Browse ${displayName}'s book collection on BookShelf.`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        window.prompt("Copy this profile link:", url);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      className={cn("gap-2", className)}
      onClick={handleShare}
      disabled={pending}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Link copied
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          Share profile
        </>
      )}
    </Button>
  );
}
