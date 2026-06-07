"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetPasswordAction } from "@/actions/password-reset";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    null,
  );

  if (state?.success) {
    return (
      <div className="mx-auto max-w-md space-y-6 py-8">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-semibold">Password reset</h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Your password has been updated successfully.
          </p>
        </div>
        <p className="text-center text-sm text-stone-500">
          <Link
            href="/login"
            className="font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
          >
            Sign in with your new password
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-semibold">Set new password</h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Enter your new password below.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />

        <div className="grid gap-2">
          <label
            htmlFor="newPassword"
            className="text-sm font-medium text-stone-700 dark:text-stone-300"
          >
            New password
          </label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-stone-700 dark:text-stone-300"
          >
            Confirm new password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        {state?.error ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Resetting…" : "Reset password"}
        </Button>
      </form>

      <p className="text-center text-sm text-stone-500">
        <Link
          href="/login"
          className="font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
