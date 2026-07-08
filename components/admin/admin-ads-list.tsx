"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ExternalLink, Store, X } from "lucide-react";
import { approveAdAction, rejectAdAction } from "@/actions/admin";
import type { AdminAdRow } from "@/types/ad";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminAdsListProps {
  ads: AdminAdRow[];
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  approved: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  rejected: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};

export function AdminAdsList({ ads }: AdminAdsListProps) {
  if (ads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 px-6 py-12 text-center text-sm text-stone-500 dark:border-stone-600">
        No ads yet.
      </div>
    );
  }

  const pendingAds = ads.filter((a) => a.status === "pending");
  const reviewedAds = ads.filter((a) => a.status !== "pending");

  return (
    <div className="space-y-6">
      {pendingAds.length > 0 ? (
        <section>
          <h3 className="mb-3 font-serif text-base font-semibold">
            Pending review ({pendingAds.length})
          </h3>
          <div className="space-y-3">
            {pendingAds.map((ad) => (
              <AdminAdRow key={ad._id} ad={ad} />
            ))}
          </div>
        </section>
      ) : null}

      {reviewedAds.length > 0 ? (
        <section>
          <h3 className="mb-3 font-serif text-base font-semibold">
            Reviewed ({reviewedAds.length})
          </h3>
          <div className="space-y-3">
            {reviewedAds.map((ad) => (
              <AdminAdRow key={ad._id} ad={ad} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function AdminAdRow({ ad }: { ad: AdminAdRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveAdAction(ad._id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleReject() {
    setError(null);
    startTransition(async () => {
      const result = await rejectAdAction(ad._id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        ad.status === "pending"
          ? "border-amber-200/80 bg-amber-50/40 dark:border-amber-800 dark:bg-amber-950/20"
          : "border-stone-200/80 bg-white/60 dark:border-stone-700 dark:bg-stone-900/40",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-stone-900 dark:text-stone-100">
              {ad.title}
            </p>
            <Badge className={cn("border-0", statusColors[ad.status])}>
              {ad.status}
            </Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">
            {ad.text}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            <Link
              href={`/admin/stores/${ad.userId}`}
              className="inline-flex items-center gap-1 text-amber-700 hover:underline dark:text-amber-400"
            >
              <Store className="h-3 w-3" />
              {ad.storeName}
              {ad.storeCity ? ` \u2014 ${ad.storeCity}` : ""}
            </Link>

            {ad.link ? (
              <a
                href={ad.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-stone-500 hover:text-amber-700 dark:hover:text-amber-400"
              >
                <ExternalLink className="h-3 w-3" />
                Link
              </a>
            ) : null}

            {ad.createdAt ? (
              <span className="text-stone-400">
                {new Date(ad.createdAt).toLocaleDateString()}
              </span>
            ) : null}
          </div>

          {error ? (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
          ) : null}
        </div>

        {ad.image ? (
          <img
            src={ad.image}
            alt=""
            className="h-14 w-14 shrink-0 rounded-lg object-cover"
          />
        ) : null}

        {ad.status === "pending" ? (
          <div className="flex shrink-0 flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={handleApprove}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
            >
              <Check className="mr-1 h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={handleReject}
              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Reject
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
