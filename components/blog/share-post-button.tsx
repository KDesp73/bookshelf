"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SharePostButtonProps {
  slug: string;
  title: string;
  excerpt?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "icon";
}

function postPageUrl(slug: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/news/${slug}`;
  }
  return `/news/${slug}`;
}

export function SharePostButton({
  slug,
  title,
  excerpt,
  className,
  variant = "outline",
  size = "sm",
}: SharePostButtonProps) {
  const [pending, setPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const pageUrl = postPageUrl(slug);
  const shareText = excerpt?.trim() || title;

  async function handleNativeShare() {
    setPending(true);
    setStatusMessage(null);

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title,
          text: shareText,
          url: pageUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(pageUrl);
      setStatusMessage("Link copied");
      window.setTimeout(() => setStatusMessage(null), 2000);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      try {
        await navigator.clipboard.writeText(pageUrl);
        setStatusMessage("Link copied");
        window.setTimeout(() => setStatusMessage(null), 2000);
      } catch {
        window.prompt("Copy this post link:", pageUrl);
      }
    } finally {
      setPending(false);
    }
  }

  const label = statusMessage ?? "Share";

  if (size === "icon") {
    return (
      <Button
        type="button"
        variant={variant}
        size="icon"
        className={cn("h-8 w-8 shrink-0", className)}
        disabled={pending}
        onClick={handleNativeShare}
        aria-label="Share post"
      >
        {statusMessage ? (
          <Check className="h-4 w-4" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("gap-2", className)}
      disabled={pending}
      onClick={handleNativeShare}
    >
      {statusMessage ? (
        <Check className="h-4 w-4" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
