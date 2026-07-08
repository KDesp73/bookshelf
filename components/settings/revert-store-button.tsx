"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeftFromLine } from "lucide-react";
import { revertToUserAction } from "@/actions/store-settings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function RevertStoreButton() {
  const router = useRouter();
  const { update } = useSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          disabled={pending}
        >
          <ArrowLeftFromLine className="mr-2 h-4 w-4" />
          Revert to normal account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revert to normal account?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Your store profile, books, and ads will be preserved but your account
          will no longer appear as a bookstore on the map or in the store
          directory. You can convert back to a store at any time.
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
            onClick={async () => {
              setPending(true);
              setError(null);
              const result = await revertToUserAction();
              if (result.error) {
                setError(result.error);
                setPending(false);
                return;
              }
              await update();
              router.refresh();
            }}
          >
            {pending ? "Reverting\u2026" : "Revert"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
