"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Undo2, Trash2 } from "lucide-react";
import { revertStoreAction, deleteStoreDataAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminStoreActionsProps {
  storeId: string;
  storeName: string;
}

export function AdminStoreActions({
  storeId,
  storeName,
}: AdminStoreActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRevert() {
    setError(null);
    startTransition(async () => {
      const result = await revertStoreAction(storeId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleClearData() {
    setError(null);
    startTransition(async () => {
      const result = await deleteStoreDataAction(storeId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            <Undo2 className="mr-1 h-3.5 w-3.5" />
            Revert to user
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revert &ldquo;{storeName}&rdquo; to a normal account?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Their store profile data will be cleared, and they will no longer
            appear as a bookstore on the map or directory. Inventory books and
            ads will be preserved.
          </p>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          <div className="flex justify-end gap-3">
            <DialogTrigger asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Cancel
              </Button>
            </DialogTrigger>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={handleRevert}
            >
              {pending ? "Reverting\u2026" : "Revert"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Clear inventory & ads
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear inventory and ads for &ldquo;{storeName}&rdquo;?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            This will permanently remove all inventory books and ads for this
            store. The store account itself will not be affected.
          </p>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          <div className="flex justify-end gap-3">
            <DialogTrigger asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Cancel
              </Button>
            </DialogTrigger>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={handleClearData}
            >
              {pending ? "Clearing\u2026" : "Clear"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
