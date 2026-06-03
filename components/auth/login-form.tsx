"use client";

import { useActionState } from "react";
import {
  loginWithCredentialsAction,
  type AuthActionState,
} from "@/actions/auth";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl = "/" }: LoginFormProps) {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    loginWithCredentialsAction,
    {},
  );

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <OAuthButtons callbackUrl={callbackUrl} />

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

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
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
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
