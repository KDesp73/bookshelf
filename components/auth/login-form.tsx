"use client";

import { useState } from "react";
import Link from "next/link";
import { loginWithCredentialsAction } from "@/actions/auth";
import type { OAuthProviderId } from "@/lib/auth/oauth-providers";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginFormProps {
  callbackUrl?: string;
  oauthProviders?: OAuthProviderId[];
  initialError?: string | null;
}

export function LoginForm({
  callbackUrl = "/",
  oauthProviders = [],
  initialError = null,
}: LoginFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [showSetPasswordHint, setShowSetPasswordHint] = useState(false);

  const showOAuth = oauthProviders.length > 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    formData.set("callbackUrl", callbackUrl);

    try {
      const result = await loginWithCredentialsAction({}, formData);

      if (result.error) {
        setError(result.error);
        setShowSetPasswordHint(result.needsPassword === true);
        setPending(false);
        return;
      }

      window.location.assign(result.redirectTo ?? "/");
    } catch {
      setError("Sign-in failed. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      {showOAuth ? (
        <>
          <OAuthButtons providers={oauthProviders} callbackUrl={callbackUrl} />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-stone-200 dark:border-stone-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-stone-500">
                Or continue with email
              </span>
            </div>
          </div>
        </>
      ) : null}

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

        {showSetPasswordHint ? (
          <p className="text-sm">
            <Link
              href="/login/set-password"
              className="font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
            >
              Set a password for this account
            </Link>
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-stone-500">
        Existing account without a password?{" "}
        <Link
          href="/login/set-password"
          className="font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
        >
          Set one here
        </Link>
      </p>
    </div>
  );
}
