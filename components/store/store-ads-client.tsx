"use client";

import { useState } from "react";
import { deleteAdAction } from "@/actions/store-ads";
import type { AdDocument } from "@/types/ad";
import { StoreAdForm } from "@/components/store/store-ad-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface StoreAdsClientProps {
  ads: AdDocument[];
}

const AD_LIMIT = 3;

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function StoreAdsClient({ ads }: StoreAdsClientProps) {
  const [editingAd, setEditingAd] = useState<AdDocument | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const atLimit = ads.length >= AD_LIMIT;

  async function handleDelete(adId: string) {
    if (!confirm("Delete this ad?")) return;
    await deleteAdAction(adId);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-semibold">Ads</h2>
          <p className="text-sm text-stone-500">
            {ads.length} of {AD_LIMIT} used
          </p>
        </div>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={atLimit}>
              {atLimit ? "Limit reached" : "Submit ad"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit a new ad</DialogTitle>
            </DialogHeader>
            <StoreAdForm onDone={() => setShowAddForm(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {atLimit ? (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          You have reached the maximum of {AD_LIMIT} ads. Delete an existing ad to submit a new one.
        </p>
      ) : null}

      {ads.length === 0 ? (
        <p className="text-sm text-stone-500">
          No ads yet. Submit your first ad to promote your store.
        </p>
      ) : (
        <div className="space-y-3">
          {ads.map((ad) => (
            <div
              key={ad._id}
              className="rounded-lg border border-stone-200 p-4 dark:border-stone-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{ad.title}</h3>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_BADGE[ad.status] ?? ""
                      }`}
                    >
                      {ad.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                    {ad.text}
                  </p>
                  {ad.link ? (
                    <a
                      href={ad.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-sm text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
                    >
                      {ad.link}
                    </a>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setEditingAd(ad)}
                        className="text-xs text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
                      >
                        Edit
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit ad</DialogTitle>
                      </DialogHeader>
                      <StoreAdForm ad={editingAd ?? undefined} onDone={() => setEditingAd(null)} />
                    </DialogContent>
                  </Dialog>
                  <button
                    type="button"
                    onClick={() => handleDelete(ad._id)}
                    className="text-xs text-red-600 underline-offset-2 hover:underline dark:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
