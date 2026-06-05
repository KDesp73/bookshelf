"use client";

import { useState } from "react";
import { Check, ChevronDown, Link2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const pageUrl = postPageUrl(slug);
  const shareText = excerpt?.trim() || title;

  async function copyLink() {
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setStatusMessage("Link copied");
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
          title,
          text: shareText,
          url: pageUrl,
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
        window.prompt("Copy this post link:", pageUrl);
      }
    } finally {
      setPending(false);
    }
  }

  const label = statusMessage ?? (copied ? "Copied" : "Share");

  if (size === "icon") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant={variant}
            size="icon"
            className={cn("h-8 w-8 shrink-0", className)}
            disabled={pending}
            aria-label="Share post"
          >
            {copied || statusMessage ? (
              <Check className="h-4 w-4" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={handleNativeShare} disabled={pending}>
            <Share2 className="h-4 w-4" />
            Share link
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              void copyLink();
            }}
            disabled={pending}
          >
            <Link2 className="h-4 w-4" />
            Copy link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
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
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={handleNativeShare} disabled={pending}>
          <Share2 className="h-4 w-4" />
          Share link
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            void copyLink();
          }}
          disabled={pending}
        >
          <Link2 className="h-4 w-4" />
          Copy link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
