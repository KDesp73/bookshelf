"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import {
  updateUserAdminPermissionsAction,
} from "@/actions/admin";
import {
  ADMIN_PERMISSIONS,
  ALL_ADMIN_PERMISSIONS,
  ADMIN_PERMISSION_LABELS,
} from "@/lib/constants";
import type { AdminPermission } from "@/lib/constants";
import { Button } from "@/components/ui/button";

interface AdminUserPermissionsProps {
  userId: string;
  userEmail: string;
  isAdmin: boolean;
  currentPermissions?: string[];
  currentAdminId: string;
}

export function AdminUserPermissions({
  userId,
  userEmail,
  isAdmin,
  currentPermissions = [],
  currentAdminId,
}: AdminUserPermissionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(isAdmin);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(currentPermissions),
  );

  const isSelf = userId === currentAdminId;

  if (isSelf) {
    return (
      <div className="rounded-xl border border-stone-200/80 bg-white/60 p-4 dark:border-stone-700 dark:bg-stone-900/40">
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <Shield className="h-4 w-4" />
          You are the current admin — you cannot change your own permissions here.
        </div>
      </div>
    );
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateUserAdminPermissionsAction(
        userId,
        isEnabled,
        isEnabled ? Array.from(selectedPermissions) as AdminPermission[] : [],
      );
      if (!result.success) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function togglePermission(permission: string) {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permission)) {
        next.delete(permission);
      } else {
        next.add(permission);
      }
      return next;
    });
  }

  return (
    <div className="rounded-xl border border-stone-200/80 bg-white/60 p-4 dark:border-stone-700 dark:bg-stone-900/40">
      <h3 className="font-serif text-lg font-semibold text-amber-950 dark:text-amber-100">
        Admin permissions
      </h3>
      <p className="mt-1 text-sm text-stone-500">
        Grant or revoke admin access and select specific permissions.
      </p>

      <div className="mt-4 space-y-4">
        <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => {
              setIsEnabled(e.target.checked);
              if (e.target.checked && selectedPermissions.size === 0) {
                setSelectedPermissions(new Set(ALL_ADMIN_PERMISSIONS));
              }
            }}
            className="rounded border-stone-300 text-amber-800 focus:ring-amber-600"
          />
          Admin access
        </label>

        {isEnabled && (
          <div className="space-y-2 pl-6">
            {ALL_ADMIN_PERMISSIONS.map((permission) => (
              <label
                key={permission}
                className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400"
              >
                <input
                  type="checkbox"
                  checked={selectedPermissions.has(permission)}
                  onChange={() => togglePermission(permission)}
                  className="rounded border-stone-300 text-amber-800 focus:ring-amber-600"
                />
                {ADMIN_PERMISSION_LABELS[permission]}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button size="sm" onClick={handleSave} disabled={pending}>
          {pending ? "Saving..." : "Save permissions"}
        </Button>
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}
