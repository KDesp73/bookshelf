"use client";

import { useActionState, useEffect } from "react";
import { changePasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [state, formAction, pending] = useActionState(changePasswordAction, {});

  useEffect(() => {
    if (state.success) {
      onSuccess?.();
    }
  }, [state.success, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="current-password">Current password</Label>
        <Input
          id="current-password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="confirm-new-password">Confirm new password</Label>
        <Input
          id="confirm-new-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          disabled={pending}
        />
      </div>

      <p className="text-xs text-stone-500">
        Use at least 8 characters. You will stay signed in after updating.
      </p>

      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          Password updated successfully.
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Updating…" : "Update password"}
        </Button>
      </div>
    </form>
  );
}
