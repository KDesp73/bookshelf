"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  deleteUserAction,
  toggleUserAdminAction,
} from "@/actions/admin";
import type { UserProfile } from "@/types/user";
import { Button } from "@/components/ui/button";

interface AdminUserActionsProps {
  user: UserProfile;
  currentAdminId: string;
}

export function AdminUserActions({
  user,
  currentAdminId,
}: AdminUserActionsProps) {
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
      router.push("/admin/users");
    });
  }

  if (isSelf) return null;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
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
          Delete user
        </Button>
      </div>
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
