"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Store, Trash2, Undo2 } from "lucide-react";
import { revertStoreAction, deleteStoreDataAction } from "@/actions/admin";
import type { AdminStoreRow } from "@/types/user";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminStoreTableProps {
  stores: AdminStoreRow[];
}

export function AdminStoreTable({ stores }: AdminStoreTableProps) {
  if (stores.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 px-6 py-12 text-center text-sm text-stone-500 dark:border-stone-600">
        No stores found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200/80 bg-white/60 dark:border-stone-700 dark:bg-stone-900/40">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-stone-200/80 bg-stone-50/80 dark:border-stone-700 dark:bg-stone-900/60">
          <tr>
            <th className="px-4 py-3 font-medium">Store</th>
            <th className="px-4 py-3 font-medium">Owner</th>
            <th className="px-4 py-3 font-medium">City</th>
            <th className="px-4 py-3 font-medium">Books</th>
            <th className="px-4 py-3 font-medium">Ads</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {stores.map((store) => (
            <AdminStoreRowActions key={store._id} store={store} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminStoreRowActions({ store }: { store: AdminStoreRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const displayName = store.storeName ?? store.name ?? store.email;

  function handleRevert() {
    setError(null);
    startTransition(async () => {
      const result = await revertStoreAction(store._id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <tr className="border-b border-stone-100 last:border-0 dark:border-stone-800">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 shrink-0 text-amber-600" />
          <Link
            href={`/admin/stores/${store._id}`}
            className="font-medium text-amber-900 hover:underline dark:text-amber-200"
          >
            {displayName}
          </Link>
        </div>
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="text-stone-900 dark:text-stone-100">{store.email}</p>
          {store.username ? (
            <p className="text-xs text-stone-500">@{store.username}</p>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
        {store.storeCity ?? "\u2014"}
      </td>
      <td className="px-4 py-3">{store.storeBookCount}</td>
      <td className="px-4 py-3">{store.adCount}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/stores/${store._id}`}>Manage</Link>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              >
                <Undo2 className="mr-1 h-3.5 w-3.5" />
                Revert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Revert &ldquo;{displayName}&rdquo; to a normal account?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Their store profile data will be cleared, and they will no
                longer appear as a bookstore on the map or directory. Their
                inventory books and ads will be preserved.
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
        </div>
      </td>
    </tr>
  );
}
