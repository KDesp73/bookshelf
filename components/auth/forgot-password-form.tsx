"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requestPasswordResetAction } from "@/actions/password-reset";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    null,
  );

  if (state?.success) {
    return (
      <div className="mx-auto max-w-md space-y-6 py-8">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-semibold">Check your email</h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            If an account with that email exists, we&apos;ve sent a password
            reset link.
          </p>
        </div>
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

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-semibold">Forgot password?</h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Enter the email address associated with your account and we&apos;ll
          send you a link to reset your password.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="grid gap-2">
          <label
            htmlFor="email"
            className="text-sm font-medium text-stone-700 dark:text-stone-300"
          >
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>

        {state?.error ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="text-center text-sm text-stone-500">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
