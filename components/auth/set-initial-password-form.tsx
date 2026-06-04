"use client";

import { useState } from "react";
import Link from "next/link";
import { setInitialPasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SetInitialPasswordForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await setInitialPasswordAction({}, formData);

      if (result.error) {
        setError(result.error);
        setPending(false);
        return;
      }

      window.location.assign(result.redirectTo ?? "/");
    } catch {
      setError("Could not set password. Try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-sm space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="set-password-email">Email</Label>
        <Input
          id="set-password-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="set-password-new">New password</Label>
        <Input
          id="set-password-new"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="set-password-confirm">Confirm password</Label>
        <Input
          id="set-password-confirm"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          disabled={pending}
        />
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Set password and sign in"}
      </Button>

      <p className="text-center text-sm text-stone-500">
        <Link
          href="/login"
          className="font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
