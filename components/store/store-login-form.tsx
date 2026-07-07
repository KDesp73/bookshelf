"use client";

import { useState } from "react";
import Link from "next/link";
import { loginStoreAction } from "@/actions/store-auth";
import type { StoreAuthState } from "@/actions/store-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StoreLoginForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result: StoreAuthState = await loginStoreAction({}, formData);

      if (result.error) {
        setError(result.error);
        setPending(false);
        return;
      }

      window.location.assign(result.redirectTo ?? "/store/dashboard");
    } catch {
      setError("Sign-in failed. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={pending}
          />
        </div>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in\u2026" : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-stone-500">
        No store account yet?{" "}
        <Link
          href="/store/register"
          className="font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
        >
          Register your store
        </Link>
      </p>
    </div>
  );
}
