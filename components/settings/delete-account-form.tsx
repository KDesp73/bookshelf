"use client";

import { useState, useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { deleteAccountAction } from "@/actions/settings";

interface DeleteAccountFormProps {
  email: string;
  hasPassword: boolean;
}

export function DeleteAccountForm({ email, hasPassword }: DeleteAccountFormProps) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(deleteAccountAction, null);

  if (!confirming) {
    return (
      <div>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Once you delete your account, all of your books, notes, and profile
          data will be permanently removed. This action cannot be undone.
        </p>
        <Button
          variant="destructive"
          size="sm"
          className="mt-3"
          onClick={() => setConfirming(true)}
        >
          Delete account
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-red-200/60 bg-red-50/50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
      <p className="text-sm font-medium text-red-800 dark:text-red-200">
        Are you sure?
      </p>
      <p className="text-sm text-red-700 dark:text-red-300">
        Type <strong>{email}</strong> to confirm{hasPassword ? " and enter your password" : ""}.
      </p>

      <form action={formAction} className="space-y-3">
        <Input
          name="confirmation"
          placeholder={email}
          autoComplete="off"
          required
        />

        {hasPassword ? (
          <Input
            name="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        ) : null}

        {state && !state.success ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => setConfirming(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            disabled={pending}
          >
            {pending ? "Deleting…" : "Permanently delete"}
          </Button>
        </div>
      </form>
    </div>
  );
}
