"use client";

import { useState } from "react";
import { Check, ChevronDown, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ShareProfileButtonProps {
  username: string;
  displayName: string;
  bio?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
}

function profilePageUrl(username: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/u/${username}`;
  }
  return `/u/${username}`;
}

function shareCardUrl(username: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/profile/${username}/share.svg`;
  }
  return `/api/profile/${username}/share.svg`;
}

export function ShareProfileButton({
  username,
  displayName,
  bio,
  className,
  variant = "outline",
}: ShareProfileButtonProps) {
  const [pending, setPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const pageUrl = profilePageUrl(username);
  const cardUrl = shareCardUrl(username);
  const shareTitle = `${displayName} on BookShelf`;
  const shareText =
    bio?.trim() || `Browse ${displayName}'s book collection on BookShelf.`;

  async function handleNativeShare() {
    setPending(true);
    setStatusMessage(null);

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: shareTitle,
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
        window.prompt("Copy this profile link:", pageUrl);
      }
    } finally {
      setPending(false);
    }
  }

  async function downloadShareCard() {
    setPending(true);
    setStatusMessage(null);

    try {
      const response = await fetch(cardUrl);
      if (!response.ok) {
        throw new Error("Could not generate share card.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${username}-bookshelf.svg`;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
      setStatusMessage("SVG downloaded");
      window.setTimeout(() => setStatusMessage(null), 2000);
    } catch {
      setStatusMessage("Could not download SVG");
      window.setTimeout(() => setStatusMessage(null), 2500);
    } finally {
      setPending(false);
    }
  }

  function openShareCardPreview() {
    window.open(cardUrl, "_blank", "noopener,noreferrer");
  }

  const label = statusMessage ?? "Share profile";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size="sm"
          className={cn("gap-2", className)}
          disabled={pending}
        >
          {statusMessage ? (
            <Check className="h-4 w-4" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          {label}
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={handleNativeShare} disabled={pending}>
          <Share2 className="h-4 w-4" />
          Share link
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            void downloadShareCard();
          }}
          disabled={pending}
        >
          <Download className="h-4 w-4" />
          Download SVG card
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openShareCardPreview} disabled={pending}>
          <Share2 className="h-4 w-4" />
          Preview SVG card
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
