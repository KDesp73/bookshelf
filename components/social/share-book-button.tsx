"use client";

import { useState } from "react";
import { Check, ChevronDown, Download, Link2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ShareBookButtonProps {
  bookId: string;
  title: string;
  authors?: string[];
  className?: string;
}

function cardUrl(bookId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/books/${bookId}/share.png`;
  }
  return `/api/books/${bookId}/share.png`;
}

export function ShareBookButton({
  bookId,
  title,
  authors,
  className,
}: ShareBookButtonProps) {
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const shareTitle = `${title} on BookShelf`;
  const shareText = authors?.length
    ? `${title} by ${authors.join(", ")} — on BookShelf`
    : `${title} — on BookShelf`;

  async function copyLink() {
    await navigator.clipboard.writeText(shareTitle);
    setCopied(true);
    setStatusMessage("Copied");
    window.setTimeout(() => {
      setCopied(false);
      setStatusMessage(null);
    }, 2000);
  }

  async function handleNativeShare() {
    setPending(true);
    setStatusMessage(null);

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
        });
        return;
      }

      await copyLink();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      try {
        await copyLink();
      } catch {
        window.prompt("Copy this book info:", shareText);
      }
    } finally {
      setPending(false);
    }
  }

  async function downloadShareCard() {
    setPending(true);
    setStatusMessage(null);

    try {
      const response = await fetch(cardUrl(bookId));
      if (!response.ok) {
        throw new Error("Could not generate share card.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${title.toLowerCase().replace(/\s+/g, "-")}-bookshelf.png`;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
      setStatusMessage("Image downloaded");
      window.setTimeout(() => setStatusMessage(null), 2000);
    } catch {
      setStatusMessage("Could not download image");
      window.setTimeout(() => setStatusMessage(null), 2500);
    } finally {
      setPending(false);
    }
  }

  function openShareCardPreview() {
    window.open(cardUrl(bookId), "_blank", "noopener,noreferrer");
  }

  const label = statusMessage ?? (copied ? "Copied" : "Share");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("gap-2", className)}
          disabled={pending}
        >
          {copied || statusMessage ? (
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
          Share
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            void copyLink();
          }}
          disabled={pending}
        >
          <Link2 className="h-4 w-4" />
          Copy info
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            void downloadShareCard();
          }}
          disabled={pending}
        >
          <Download className="h-4 w-4" />
          Download PNG card
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openShareCardPreview} disabled={pending}>
          <Share2 className="h-4 w-4" />
          Preview card
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
