"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Trash2 } from "lucide-react";
import {
  deleteUserAction,
  toggleUserAdminAction,
} from "@/actions/admin";
import type { AdminUserRow } from "@/types/user";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminUserTableProps {
  users: AdminUserRow[];
  currentAdminId: string;
}

export function AdminUserTable({ users, currentAdminId }: AdminUserTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200/80 bg-white/60 dark:border-stone-700 dark:bg-stone-900/40">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-stone-200/80 bg-stone-50/80 dark:border-stone-700 dark:bg-stone-900/60">
          <tr>
            <th className="px-4 py-3 font-medium">User</th>
            <th className="px-4 py-3 font-medium">Books</th>
            <th className="px-4 py-3 font-medium">Likes</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Joined</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <AdminUserRowActions
              key={user._id}
              user={user}
              currentAdminId={currentAdminId}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminUserRowActions({
  user,
  currentAdminId,
}: {
  user: AdminUserRow;
  currentAdminId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isSelf = user._id === currentAdminId;

  function handleToggleAdmin() {
    setError(null);
    startTransition(async () => {
      const result = await toggleUserAdminAction(user._id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete() {
    if (
      !confirm(
        `Delete ${user.email}? This removes their account, books, and likes permanently.`,
      )
    ) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deleteUserAction(user._id);
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
        <div>
          <Link
            href={`/admin/users/${user._id}`}
            className="font-medium text-amber-900 hover:underline dark:text-amber-200"
          >
            {user.name ?? user.username ?? user.email}
          </Link>
          <p className="text-xs text-stone-500">{user.email}</p>
          {user.username ? (
            <p className="text-xs text-stone-500">@{user.username}</p>
          ) : null}
        </div>
        {error ? (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
        ) : null}
      </td>
      <td className="px-4 py-3">{user.bookCount}</td>
      <td className="px-4 py-3">{user.likeCount}</td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            user.isAdmin
              ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
              : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
          )}
        >
          {user.isAdmin ? (
            <>
              <Shield className="h-3 w-3" />
              Admin
            </>
          ) : (
            "User"
          )}
        </span>
      </td>
      <td className="px-4 py-3 text-stone-500">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/users/${user._id}`}>Manage</Link>
          </Button>
          {!isSelf ? (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={handleToggleAdmin}
              >
                {user.isAdmin ? "Revoke admin" : "Make admin"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={pending}
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
