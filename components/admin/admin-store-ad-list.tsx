"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import type { AdDocument } from "@/types/ad";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminStoreAdListProps {
  ads: AdDocument[];
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  approved: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  rejected: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};

export function AdminStoreAdList({ ads,}: AdminStoreAdListProps) {
  if (ads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 px-6 py-12 text-center text-sm text-stone-500 dark:border-stone-600">
        No ads.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {ads.map((ad) => (
        <AdminAdRow key={ad._id} ad={ad} />
      ))}
    </div>
  );
}

function AdminAdRow({ ad }: { ad: AdDocument }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-stone-200/80 bg-white/60 p-3 dark:border-stone-700 dark:bg-stone-900/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-stone-900 dark:text-stone-100">
            {ad.title}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-stone-500">{ad.text}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge
              className={cn("border-0", statusColors[ad.status])}
            >
              {ad.status}
            </Badge>
            {ad.link ? (
              <a
                href={ad.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-amber-700 hover:underline dark:text-amber-400"
              >
                <ExternalLink className="h-3 w-3" />
                Link
              </a>
            ) : null}
          </div>
        </div>
        {error ? (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
